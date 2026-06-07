"""Hybrid retriever (Dense + BM25 + RRF) untuk Lapis AI RAG Pipeline."""

import json
import logging
import re
import yaml
from collections import defaultdict
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from rank_bm25 import BM25Okapi

from nlp.embeddings.embedder import EmbeddingModel
from nlp.embeddings.vector_store import VectorStore
from nlp.retrieval.query_router import QueryMode, RouterResult


# ── Logging Setup ──────────────────────────────────────────────────────────────

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


# ── Dataclass ──────────────────────────────────────────────────────────────────


@dataclass
class RetrievalResult:
    """Satu chunk hasil retrieval dengan skor dense, BM25, dan RRF."""

    chunk_id        : str
    score           : float                           # skor final
    dense_score     : Optional[float] = None
    bm25_score      : Optional[float] = None
    rrf_score       : Optional[float] = None
    chunk_type      : str = ""
    machine_ids     : List[str] = field(default_factory=list)
    source_doc      : str = ""
    source_page     : int = 0
    doc_type        : str = ""
    priority        : int = 1
    text_content    : str = ""
    retrieval_method: str = "hybrid"   # "dense" | "bm25" | "hybrid"

    def to_dict(self) -> Dict:
        """Serialisasi RetrievalResult ke plain dict."""
        return asdict(self)

    def get_citation(self) -> Dict:
        """Return citation card untuk Frontend."""
        return {
            "source_doc": self.source_doc,
            "page"      : self.source_page,
            "chunk_id"  : self.chunk_id,
            "doc_type"  : self.doc_type,
            "relevance" : round(self.score, 4),
        }


# ── Retriever Class ────────────────────────────────────────────────────────────


class HybridRetriever:
    """Dense + BM25 hybrid retriever dengan Reciprocal Rank Fusion."""

    def __init__(self, config_path: str = "nlp/configs/config.yaml") -> None:
        """Inisialisasi retriever dengan config, embedder, dan vector store."""
        with open(config_path, "r", encoding="utf-8") as f:
            self.config: Dict = yaml.safe_load(f)

        self.config_path = config_path
        self.logger = logging.getLogger(self.__class__.__name__)

        ret = self.config["retrieval"]
        self.top_k_dense  : int = ret["top_k_dense"]
        self.top_k_sparse : int = ret["top_k_sparse"]
        self.top_k_rrf    : int = ret["top_k_after_rrf"]
        self.top_k_final  : int = ret["top_k_final"]
        self.rrf_k        : int = ret["rrf_k"]

        self.embedder     = EmbeddingModel.get_instance(config_path)
        self.vector_store = VectorStore(config_path)

        # BM25 lazy state
        self._bm25_index  = None
        self._bm25_chunks : Optional[List[Dict]] = None
        self._all_chunks  : Optional[List[Dict]] = None

        # Machine Summary Index (built on first _load_all_chunks call)
        self._machine_summary: Optional[Dict[str, List[Dict]]] = None

    # ── Data Loading ───────────────────────────────────────────────────────────

    def _load_all_chunks(self) -> List[Dict]:
        """Load semua chunks dari processed_dir ke flat list (cached)."""
        if self._all_chunks is not None:
            return self._all_chunks

        processed_dir = Path(self.config["paths"]["data_processed"])
        chunk_files   = sorted(processed_dir.glob("*.chunks.json"))

        if not chunk_files:
            self.logger.warning(
                "No *.chunks.json found in '%s'. BM25 index will be empty.",
                processed_dir,
            )
            self._all_chunks = []
            return self._all_chunks

        all_chunks: List[Dict] = []
        for path in chunk_files:
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data: List[Dict] = json.load(f)
                
                # Derive source_doc dari doc_id jika tidak ada di JSON
                for chunk in data:
                    if not chunk.get("source_doc"):
                        chunk["source_doc"] = chunk.get("doc_id", "") + ".pdf"

                all_chunks.extend(data)
            except (json.JSONDecodeError, OSError) as err:
                self.logger.error("Failed to load '%s': %s", path.name, err)

        # Map equivalent metadata fields for backward compatibility 
        for c in all_chunks: 
            c["text_content"] = c.get("text", "") 
            meta = c.get("metadata", {}) 
            m_ids = meta.get("detected_machine_ids", []) 
            c["machine_ids"] = m_ids if m_ids else ["ALL"] 
            c["chunk_type"] = c.get("strategy_used", "unknown") 
            
            # Infer doc_type from filename to support downsteam routing/filtering 
            source_file = meta.get("source_file", "").lower() 
            doc_type = "unknown" 
            if "laporan" in source_file: 
                doc_type = "maintenance_report" 
            elif "knowledge" in source_file: 
                doc_type = "knowledge_base" 
            elif "schema" in source_file: 
                doc_type = "schema" 
            elif "api" in source_file or "contract" in source_file: 
                doc_type = "api_contract" 
            elif any(kw in source_file for kw in ["manual", "buku", "handbook", "panduan"]): 
                doc_type = "manual" 
            elif "sop" in source_file: 
                doc_type = "sop" 
            
            c["doc_type"] = doc_type 
            c["priority"] = 1 

        self.logger.info(
            "_load_all_chunks: %d file(s) → %d chunks total.",
            len(chunk_files),
            len(all_chunks),
        )
        self._all_chunks = all_chunks

        # Build Machine Summary Index                                  
        self._build_machine_summary()                                  

        return self._all_chunks

    def _build_machine_summary(self) -> None:                          
        """Build index machine_id → [METADATA+SUMMARY chunks]."""
        if self._all_chunks is None:                                   
            return                                                     
        self._machine_summary = {}                                     
        for c in self._all_chunks:                                     
            section = (c.get("section_name") or "").upper()             
            if section not in ("METADATA", "SUMMARY"):                  
                continue                                               
            for mid in c.get("machine_ids", []):                        
                if mid == "ALL":                                        
                    continue                                           
                self._machine_summary.setdefault(mid, []).append(c)    
        # Sort per machine by doc_id (chronological)                   
        for mid in self._machine_summary:                              
            self._machine_summary[mid].sort(                           
                key=lambda x: x.get("doc_id", "")                      
            )                                                         
        self.logger.info(                                              
            "Machine Summary Index: %d machines, %d summary chunks.",  
            len(self._machine_summary),                                
            sum(len(v) for v in self._machine_summary.values()),       
        )                                                             

    # ── BM25 Index ─────────────────────────────────────────────────────────────

    def _build_bm25_index(self) -> None:
        """Bangun BM25 index (lazy — hanya dieksekusi sekali)."""
        if self._bm25_index is not None:
            return

        chunks = self._load_all_chunks()
        if not chunks:
            self.logger.warning("Empty chunk list — BM25 index not built.")
            return

        corpus = [c.get("text_content", c.get("text", "")).lower().split() for c in chunks]  
        self._bm25_index  = BM25Okapi(corpus)
        self._bm25_chunks = chunks
        self.logger.info("BM25 index built: %d documents.", len(corpus))

    # ── Dense Search ───────────────────────────────────────────────────────────

    def _dense_search(
        self,
        query: str,
        router_result: RouterResult,
        top_k: int,
    ) -> List[Dict]:
        """Dense vector search di Qdrant dengan filter dari RouterResult."""
        try:
            self.embedder.load_model()
            query_vec = self.embedder.embed_query(query)

            machine_ids  = router_result.machine_ids  or None
            chunk_types  = router_result.chunk_types  or None
            doc_types    = router_result.doc_types    or None
            min_priority = router_result.min_priority

            results = self.vector_store.search_with_filter(
                query_vector=query_vec,
                top_k=top_k,
                machine_ids=machine_ids,
                chunk_types=chunk_types,
                min_priority=min_priority,
                doc_types=doc_types,
            )

            # Tambahkan field dense_score untuk tracking
            for r in results:
                r["dense_score"] = r.get("score", 0.0)

            self.logger.info("Dense search → %d results.", len(results))
            return results

        except Exception as err:
            self.logger.warning(
                "Dense search failed (collection mungkin belum diisi): %s", err
            )
            return []

    # ── BM25 Search ────────────────────────────────────────────────────────────

    def _bm25_search(
        self,
        query: str,
        router_result: RouterResult,
        top_k: int,
    ) -> List[Dict]:
        """BM25 sparse search dengan post-filter dari RouterResult."""
        self._build_bm25_index()

        if self._bm25_index is None or not self._bm25_chunks:
            self.logger.warning("BM25 index unavailable — returning empty.")
            return []

        query_tokens = query.lower().split()
        scores       = self._bm25_index.get_scores(query_tokens)

        # Ambil kandidat lebih banyak sebelum filter
        candidate_n  = top_k * 3
        ranked_idx   = sorted(
            range(len(scores)), key=lambda i: scores[i], reverse=True
        )[:candidate_n]

        max_score = scores[ranked_idx[0]] if ranked_idx else 1.0
        if max_score == 0:
            max_score = 1.0

        # Bangun filter sets dari router_result
        machine_filter    = set(router_result.machine_ids)
        chunk_type_filter = set(router_result.chunk_types)
        doc_type_filter   = set(router_result.doc_types)

        filtered: List[Dict] = []
        for idx in ranked_idx:
            chunk = self._bm25_chunks[idx]

            # ── Post-filter ────────────────────────────────────────────────────
            if machine_filter:
                chunk_machines = set(chunk.get("machine_ids") or [])
                if not chunk_machines.intersection(machine_filter):
                    continue

            if chunk_type_filter:
                if chunk.get("chunk_type") not in chunk_type_filter:
                    continue

            if doc_type_filter:
                if chunk.get("doc_type") not in doc_type_filter:
                    continue

            bm25_norm = float(scores[idx]) / max_score
            result    = {
                "chunk_id"    : chunk.get("chunk_id", ""),
                "score"       : bm25_norm,
                "bm25_score"  : bm25_norm,
                "text_content": chunk.get("text_content", chunk.get("text", "")),  
                "source_doc"  : chunk.get("source_doc", ""),
                "source_page" : chunk.get("source_page", 0),
                "chunk_type"  : chunk.get("chunk_type", ""),
                "machine_ids" : chunk.get("machine_ids") or [],
                "doc_type"    : chunk.get("doc_type", ""),
                "priority"    : chunk.get("priority", 1),
                "payload"     : chunk,
            }
            filtered.append(result)
            if len(filtered) >= top_k:
                break

        self.logger.info("BM25 search → %d results (after filter).", len(filtered))
        return filtered

    # ── RRF Fusion ─────────────────────────────────────────────────────────────

    def _rrf_fusion(
        self,
        dense_results: List[Dict],
        bm25_results : List[Dict],
        top_k        : int,
    ) -> List[Dict]:
        """Reciprocal Rank Fusion — gabungkan dense dan BM25 rankings."""
        rrf_scores    : Dict[str, float] = defaultdict(float)
        chunk_registry: Dict[str, Dict]  = {}

        # Kontribusi dense
        for rank, r in enumerate(dense_results):
            cid = r["chunk_id"]
            rrf_scores[cid]    += 1.0 / (self.rrf_k + rank + 1)
            chunk_registry[cid] = r

        # Kontribusi BM25
        for rank, r in enumerate(bm25_results):
            cid = r["chunk_id"]
            rrf_scores[cid] += 1.0 / (self.rrf_k + rank + 1)
            if cid not in chunk_registry:
                chunk_registry[cid] = r
            else:
                # Update bm25_score jika chunk sudah ada dari dense
                chunk_registry[cid]["bm25_score"] = r.get("bm25_score")

        # Urutkan berdasarkan RRF score
        top_ids = sorted(rrf_scores, key=lambda k: rrf_scores[k], reverse=True)[:top_k]

        fused: List[Dict] = []
        for cid in top_ids:
            data = chunk_registry[cid].copy()
            data["rrf_score"]        = rrf_scores[cid]
            data["score"]            = rrf_scores[cid]
            data["retrieval_method"] = "hybrid"
            fused.append(data)

        self.logger.info("RRF fusion → %d results.", len(fused))
        return fused

    # ── Section-Aware Score Boosting ───────────────────────────────────────────

    # Keyword sets untuk deteksi intent query                         
    _EVENT_KEYWORDS = {                                               
        "emergency", "corrective", "short circuit", "kebocoran",       
        "bearing", "overheat", "kerusakan", "ganti", "rusak",          
        "putus", "berhenti", "mati", "shutdown",                       
    }                                                                 
    _SPEC_KEYWORDS = {                                                
        "batas", "suhu", "getaran", "tekanan", "rpm", "threshold",     
        "kritis", "warning", "normal", "spesifikasi", "operasional",   
    }                                                                 
    _AGGREGATION_KEYWORDS = {                                         
        "ringkasan", "total", "summary", "rangkum", "berapa kali",     
        "sepanjang", "seluruh", "agregasi", "statistik",               
    }                                                                 
    _BROAD_KEYWORDS = {                                               
        "kapan saja", "berapa kali", "daftar", "riwayat",              
        "semua maintenance", "semua pemeliharaan", "history",           
        "selama ini", "sejauh ini", "track record",                    
        "pernah", "catatan", "log maintenance", "semua kejadian",      
    }                                                                 
    _EVENT_PATTERNS = re.compile(                                     
        r"ML-\d{3,4}|\d{2}/\d{2}/\d{4}", re.IGNORECASE               
    )                                                                 

    def _apply_section_boost(                                         
        self, raw_results: List[Dict], query: str                     
    ) -> List[Dict]:                                                  
        """
        Boost/penalize score berdasarkan section_name chunk dan intent query.
        Diterapkan setelah RRF fusion, sebelum konversi ke RetrievalResult.
        """                                                           
        q_lower = query.lower()                                       

        is_event_query = (                                            
            any(kw in q_lower for kw in self._EVENT_KEYWORDS)         
            or bool(self._EVENT_PATTERNS.search(query))               
        )                                                             
        is_spec_query = any(                                          
            kw in q_lower for kw in self._SPEC_KEYWORDS               
        )                                                             
        is_agg_query = any(                                           
            kw in q_lower for kw in self._AGGREGATION_KEYWORDS        
        )                                                             

        for r in raw_results:                                         
            # Ambil section_name dari berbagai kemungkinan field       
            section = (
                r.get("section_name")
                or r.get("chunk_type")
                or ""
            ).upper()                                                 
            doc_id = r.get("chunk_id", "")                             
            payload = r.get("payload") or {}                           
            if not section and isinstance(payload, dict):              
                section = (payload.get("section_name") or "").upper()  

            original = r["score"]                                     

            # Rule 1: Event query → boost TIMELINE                    
            if is_event_query and "TIMELINE" in section:               
                r["score"] *= 1.3                                     

            # Rule 2: Spec query → boost manual/spesifikasi           
            if is_spec_query and (                                    
                "SPESIFIKASI" in section                               
                or "SPEC" in section                                   
                or "Buku_Manual" in doc_id                             
                or "buku_manual" in doc_id.lower()                     
            ):                                                        
                r["score"] *= 1.2                                     

            # Rule 3: METADATA penalty (kecuali aggregation query)    
            if "METADATA" in section and not is_agg_query:            
                r["score"] *= 0.85                                    

            if r["score"] != original:                                
                self.logger.debug(                                    
                    "Boost %s: %.4f → %.4f (section=%s)",             
                    r.get("chunk_id", "?"), original,                  
                    r["score"], section,                               
                )                                                     

        # Re-sort setelah boosting                                    
        raw_results.sort(key=lambda x: x["score"], reverse=True)      
        return raw_results                                            

    # ── Document-Level Grouping ───────────────────────────────────────────────

    # Section priority untuk sorting intra-dokumen (default: event-oriented)
    _SECTION_PRIORITY_EVENT = {                                        
        "TIMELINE": 0, "TIMELINE PEMELIHARAAN": 0,                    
        "SUMMARY": 1,                                                 
        "METADATA": 2,                                                
    }                                                                 
    _SECTION_PRIORITY_AGG = {                                         
        "SUMMARY": 0,                                                 
        "METADATA": 1,                                                
        "TIMELINE": 2, "TIMELINE PEMELIHARAAN": 2,                    
    }                                                                 

    # SOP / prosedur / manual keywords                                
    _SOP_KEYWORDS = {                                                 
        "prosedur", "loto", "keselamatan", "apd", "langkah",          
        "cara", "bagaimana", "500 jam", "inspeksi rutin",             
        "manual", "panduan", "sop",                                   
    }                                                                 

    def _get_section_priority(                                        
        self, chunk: Dict, priority_map: Optional[Dict] = None,       
    ) -> int:                                                         
        """Return section priority (lower = higher priority)."""      
        pmap = priority_map or self._SECTION_PRIORITY_EVENT           
        section = (                                                   
            chunk.get("section_name") or chunk.get("chunk_type") or ""
        ).upper()                                                     
        for key, prio in pmap.items():                                
            if key in section:                                        
                return prio                                           
        return 3  # lainnya                                           

    def _expand_to_document_chunks(                                   
        self,                                                         
        raw_results: List[Dict],                                      
        query: str,                                                   
    ) -> List[Dict]:                                                  
        """
        Expand hasil retrieval ke sibling chunks dari dokumen yang sama.
        Parameter max_docs/max_per_doc ditentukan otomatis berdasarkan
        intent query (aggregation vs SOP vs event).
        """                                                           
        if not raw_results:                                           
            return raw_results                                        

        q_lower = query.lower()                                       

        # ── Deteksi intent query ──────────────────────────────────── 
        is_agg_query = any(                                           
            kw in q_lower for kw in self._AGGREGATION_KEYWORDS        
        ) or any(                                                     
            p in q_lower for p in [                                   
                "semua bulan", "tahun 2025", "berapa kali total",     
            ]                                                         
        )                                                             
        is_sop_query = any(                                           
            kw in q_lower for kw in self._SOP_KEYWORDS                
        )                                                             

        # ── Tentukan parameter berdasarkan intent ─────────────────── 
        if is_agg_query:                                              
            max_docs    = 4                                           
            max_per_doc = 2                                           
            max_total   = 8                                           
            prio_map    = self._SECTION_PRIORITY_AGG                  
            intent_label = "aggregation"                              
        elif is_sop_query:                                            
            max_docs    = 1                                           
            max_per_doc = 4                                           
            max_total   = 4                                           
            prio_map    = self._SECTION_PRIORITY_EVENT                
            intent_label = "sop"                                      
        else:                                                         
            max_docs    = 1                                           
            max_per_doc = 4                                           
            max_total   = 4                                           
            prio_map    = self._SECTION_PRIORITY_EVENT                
            intent_label = "event"                                    

        self.logger.info(                                             
            "Doc expansion intent=%s → max_docs=%d, max_per_doc=%d",  
            intent_label, max_docs, max_per_doc,                      
        )                                                             

        # ── Pastikan _all_chunks sudah di-load ────────────────────── 
        all_chunks = self._load_all_chunks()                          
        chunks_by_doc: Dict[str, List[Dict]] = defaultdict(list)      
        for c in all_chunks:                                          
            did = c.get("doc_id", "")                                  
            if did:                                                   
                chunks_by_doc[did].append(c)                          

        # ── Step 1: Top doc_ids unik berdasarkan skor tertinggi ──── 
        seen_docs: Dict[str, float] = {}                              
        existing_ids: set = set()                                     
        for r in raw_results:                                         
            did = r.get("doc_id", "")                                  
            if not did and "__" in r.get("chunk_id", ""):              
                did = r["chunk_id"].split("__")[0]                     
            if did and did not in seen_docs:                          
                seen_docs[did] = r["score"]                           
            existing_ids.add(r.get("chunk_id", ""))                    

        top_doc_ids = sorted(                                         
            seen_docs, key=lambda d: seen_docs[d], reverse=True       
        )[:max_docs]                                                  

        self.logger.info(                                             
            "Document expansion: top %d docs = %s",                   
            len(top_doc_ids), top_doc_ids,                            
        )                                                             

        # ── Step 2-4: Pull + sort + limit per doc ─────────────────── 
        expanded: List[Dict] = []                                     
        for did in top_doc_ids:                                       
            doc_score = seen_docs[did]                                 
            siblings  = chunks_by_doc.get(did, [])                    

            siblings.sort(                                            
                key=lambda c: self._get_section_priority(c, prio_map) 
            )                                                         

            count = 0                                                 
            for sib in siblings:                                      
                if count >= max_per_doc:                               
                    break                                             
                cid = sib.get("chunk_id", "")                          
                if cid in existing_ids:                                
                    for r in raw_results:                              
                        if r.get("chunk_id") == cid:                   
                            expanded.append(r)                        
                            break                                     
                else:                                                 
                    new_chunk = sib.copy()                             
                    new_chunk["score"]            = 0.5 * doc_score    
                    new_chunk["retrieval_method"] = "doc_expansion"     
                    new_chunk["rrf_score"]        = None               
                    new_chunk["dense_score"]      = None               
                    new_chunk["bm25_score"]       = None               
                    expanded.append(new_chunk)                        
                    existing_ids.add(cid)                              
                count += 1                                            

        # ── Step 4b: SOP fallback — inject Buku_Manual jika absent ── 
        if is_sop_query:                                              
            has_manual = any(                                         
                "buku_manual" in r.get("chunk_id", "").lower()        
                for r in expanded                                     
            )                                                         
            if not has_manual:                                        
                self.logger.info("SOP query: no manual chunk found, injecting.")  
                for c in all_chunks:                                   
                    cid = c.get("chunk_id", "")                        
                    if "buku_manual" in cid.lower() and cid not in existing_ids:  
                        new_chunk = c.copy()                           
                        new_chunk["score"]            = 0.6            
                        new_chunk["retrieval_method"] = "sop_inject"   
                        new_chunk["rrf_score"]        = None           
                        new_chunk["dense_score"]      = None           
                        new_chunk["bm25_score"]       = None           
                        expanded.append(new_chunk)                    
                        existing_ids.add(cid)                          
                        if len(expanded) >= max_total:                  
                            break                                     

        # ── Step 5: Sort final by score desc, limit to max_total ──── 
        expanded.sort(key=lambda x: x.get("score", 0), reverse=True)  
        expanded = expanded[:max_total]                                

        self.logger.info(                                             
            "Document expansion: %d → %d chunks (intent=%s).",        
            len(raw_results), len(expanded), intent_label,            
        )                                                             
        return expanded                                               

    # ── Broad Machine Retrieval (Machine Summary Index) ───────────────────

    _PERIOD_MONTHS = {                                                 
        "januari": "Januari", "februari": "Februari", "maret": "Maret", 
        "april": "April", "mei": "Mei", "juni": "Juni",                
        "juli": "Juli", "agustus": "Agustus",                           
        "september": "September", "oktober": "Oktober",                 
        "november": "November", "desember": "Desember",                 
    }                                                                 

    def _is_broad_query(self, query: str) -> bool:                     
        """Deteksi apakah query bersifat broad/enumerate."""
        q = query.lower()                                              
        return (
            any(kw in q for kw in self._BROAD_KEYWORDS)                
            or any(kw in q for kw in self._AGGREGATION_KEYWORDS)       
        )                                                             

    def _extract_period_filter(self, query: str) -> Optional[str]:     
        """Extract bulan dari query jika ada, return None jika tidak."""
        q = query.lower()                                              
        for key, val in self._PERIOD_MONTHS.items():                   
            if key in q:                                               
                return val                                             
        return None                                                    

    def _broad_machine_retrieval(                                      
        self,                                                          
        query: str,                                                    
        machine_ids: List[str],                                        
    ) -> List[Dict]:                                                   
        """
        Fast path: bypass dense search, langsung ambil semua
        METADATA+SUMMARY dari Machine Summary Index.
        """                                                            
        # Pastikan index sudah di-build                                
        self._load_all_chunks()                                        
        if not self._machine_summary:                                  
            return []                                                  

        period_filter = self._extract_period_filter(query)              
        results: List[Dict] = []                                       

        target_mids = machine_ids if machine_ids else list(             
            self._machine_summary.keys()                               
        )                                                             

        for mid in target_mids:                                        
            summaries = self._machine_summary.get(mid, [])             
            for s in summaries:                                        
                doc_id = s.get("doc_id", "")                            
                # Period filter: skip dokumen yang tidak match bulan   
                if period_filter and period_filter not in doc_id:       
                    continue                                           
                chunk = s.copy()                                       
                chunk["score"]            = 1.0                        
                chunk["retrieval_method"] = "machine_index"             
                chunk["dense_score"]      = None                       
                chunk["bm25_score"]       = None                       
                chunk["rrf_score"]        = None                       
                results.append(chunk)                                  

        self.logger.info(                                              
            "Broad retrieval: %d machines → %d summary chunks "
            "(period=%s).",
            len(target_mids), len(results),                            
            period_filter or "all",                                    
        )                                                             
        return results                                                 

    # ── Main Retrieve ──────────────────────────────────────────────────────────

    def retrieve(
        self,
        query        : str,
        router_result: RouterResult,
        use_hybrid   : bool = True,
    ) -> List[RetrievalResult]:
        """Entry point retrieval — hybrid (default) atau dense-only."""
        self.logger.info(
            "Retrieving for mode=%s | use_hybrid=%s",
            router_result.mode.value,
            use_hybrid,
        )

        # ── Fast path: broad query → Machine Summary Index ───────── 
        if self._is_broad_query(query):                                
            machine_ids = router_result.machine_ids or []              
            raw_results = self._broad_machine_retrieval(                
                query, machine_ids                                     
            )                                                         
            if raw_results:                                            
                retrieval_method = "machine_index"                     
                # Convert ke RetrievalResult dan return langsung       
                results: List[RetrievalResult] = []                    
                for r in raw_results:                                  
                    results.append(RetrievalResult(                    
                        chunk_id        = r.get("chunk_id", ""),        
                        score           = float(r.get("score", 1.0)),  
                        dense_score     = r.get("dense_score"),        
                        bm25_score      = r.get("bm25_score"),         
                        rrf_score       = r.get("rrf_score"),          
                        chunk_type      = r.get("chunk_type", ""),      
                        machine_ids     = r.get("machine_ids") or [],  
                        source_doc      = r.get("source_doc", ""),      
                        source_page     = int(r.get("source_page") or 0),  
                        doc_type        = r.get("doc_type", ""),        
                        priority        = int(r.get("priority") or 1), 
                        text_content    = r.get("text_content", r.get("text", "")),  
                        retrieval_method= "machine_index",             
                    ))                                                
                self.logger.info(                                      
                    "Retrieved %d chunks | method=machine_index",       
                    len(results),                                      
                )                                                     
                return results                                         
            # Fallback: jika index kosong, lanjut ke normal retrieval  

        # Expanded query untuk embedding; query asli untuk BM25
        embed_query = router_result.expanded_query or query

        if use_hybrid:
            dense_results = self._dense_search(
                embed_query, router_result, self.top_k_dense
            )
            bm25_results  = self._bm25_search(
                query, router_result, self.top_k_sparse
            )
            raw_results   = self._rrf_fusion(
                dense_results, bm25_results, self.top_k_rrf
            )
            retrieval_method = "hybrid"
        else:
            raw_results      = self._dense_search(
                embed_query, router_result, self.top_k_final
            )
            for r in raw_results:
                r["retrieval_method"] = "dense"
            retrieval_method = "dense"

        # Section-aware score boosting                                
        raw_results = self._apply_section_boost(raw_results, query)   

        # Document-level grouping — expand ke sibling chunks          
        raw_results = self._expand_to_document_chunks(                 
            raw_results, query                                        
        )                                                             

        # Potong ke top_k_final
        raw_results = raw_results[: self.top_k_final]

        # Convert ke RetrievalResult
        results: List[RetrievalResult] = []
        for r in raw_results:
            results.append(RetrievalResult(
                chunk_id        = r.get("chunk_id", ""),
                score           = float(r.get("score", 0.0)),
                dense_score     = r.get("dense_score"),
                bm25_score      = r.get("bm25_score"),
                rrf_score       = r.get("rrf_score"),
                chunk_type      = r.get("chunk_type", ""),
                machine_ids     = r.get("machine_ids") or [],
                source_doc      = r.get("source_doc", ""),
                source_page     = int(r.get("source_page") or 0),
                doc_type        = r.get("doc_type", ""),
                priority        = int(r.get("priority") or 1),
                text_content    = r.get("text_content", r.get("text", "")),  
                retrieval_method= r.get("retrieval_method", retrieval_method),
            ))

        self.logger.info(
            "Retrieved %d chunks | method=%s", len(results), retrieval_method
        )
        return results

    def retrieve_with_query(
        self,
        raw_query       : str,
        machine_ids_hint: Optional[List[str]] = None,
    ) -> Tuple[List[RetrievalResult], RouterResult]:
        """Convenience method: route + retrieve dalam satu panggilan."""
        # Import di dalam method untuk menghindari circular import
        from nlp.retrieval.query_router import QueryRouter

        router        = QueryRouter(self.config_path)
        router_result = router.route(raw_query, machine_ids_hint)
        results       = self.retrieve(raw_query, router_result)
        return results, router_result


# ── Entry Point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    from nlp.retrieval.query_router import QueryRouter

    print("=== LAPIS AI — HYBRID RETRIEVER TEST ===\n")

    retriever = HybridRetriever()
    router    = QueryRouter()

    test_cases = [
        {
            "query" : "Apa yang terjadi pada M-01 saat emergency?",
            "hint"  : ["M-01"],
            "expect": "event_emergency M-01",
        },
        {
            "query" : "Bagaimana prosedur LOTO dan keselamatan?",
            "hint"  : None,
            "expect": "safety manual",
        },
        {
            "query" : "Short circuit ML-0058 panel kontrol",
            "hint"  : None,
            "expect": "kode teknis spesifik",
        },
    ]

    for tc in test_cases:
        print(f"Query: '{tc['query']}'")
        results, route = retriever.retrieve_with_query(tc["query"], tc["hint"])
        print(f"Mode    : {route.mode.value}")
        print(f"Results : {len(results)} chunks")
        for i, r in enumerate(results[:3], 1):
            print(f"  [{i}] score={r.score:.4f} | {r.chunk_id}")
            print(f"       type={r.chunk_type} | machine={r.machine_ids}")
            print(f"       method={r.retrieval_method}")
        print("-" * 55)
