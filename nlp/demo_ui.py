"""Demo UI Streamlit untuk Lapis AI RAG Pipeline — HTTP client mode."""

import json
import os
import uuid

import httpx
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

# ── Page config ────────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Lapis AI — Predictive Maintenance",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Konstanta ──────────────────────────────────────────────────────────────────
API_BASE_URL    = os.environ.get("NLP_API_URL", "http://localhost:8001")
REQUEST_TIMEOUT = 120  # detik — DeepSeek bisa lambat

# ══════════════════════════════════════════════════════════════════════════════
# API HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def check_health() -> dict:
    """Cek status FastAPI server."""
    try:
        r = httpx.get(f"{API_BASE_URL}/nlp/health", timeout=5)
        return r.json()
    except Exception:
        return {
            "status"        : "error",
            "vector_db"     : "error",
            "chunks_indexed": 0,
            "llm_status"    : "error",
            "llm_provider"  : "?",
        }


def query_api(
    query      : str,
    machine_ids: list,
    session_id : str,
    history    : list,
) -> dict:
    """Kirim query ke FastAPI dan return response dict."""
    payload = {
        "query"       : query,
        "machine_ids" : machine_ids if machine_ids else None,
        "session_id"  : session_id,
        "history"     : history,
        "use_reranker": True,
        "use_hybrid"  : True,
    }
    try:
        r = httpx.post(
            f"{API_BASE_URL}/nlp/query",
            json    = payload,
            timeout = REQUEST_TIMEOUT,
        )
        r.raise_for_status()
        return r.json()
    except httpx.TimeoutException:
        return {"error": "Request timeout — DeepSeek sedang sibuk, coba lagi"}
    except httpx.HTTPStatusError as e:
        detail = ""
        try:
            detail = e.response.json().get("detail", "")
        except Exception:
            pass
        return {"error": f"Server error {e.response.status_code}: {detail}"}
    except Exception as e:
        return {"error": f"Koneksi gagal ke {API_BASE_URL}: {str(e)}"}


# ══════════════════════════════════════════════════════════════════════════════
# SESSION STATE
# ══════════════════════════════════════════════════════════════════════════════

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "session_id" not in st.session_state:
    st.session_state.session_id = f"SES-{str(uuid.uuid4())[:8].upper()}"
if "last_response" not in st.session_state:
    st.session_state.last_response = None
if "query_input" not in st.session_state:
    st.session_state.query_input = ""

# ══════════════════════════════════════════════════════════════════════════════
# HEADER & STATUS BADGES
# ══════════════════════════════════════════════════════════════════════════════

st.title("🏭 Lapis AI — Predictive Maintenance Assistant")
st.caption("RAG Pipeline Demo | NLP Module | PT Tirta Segar")

health = check_health()

col1, col2, col3, col4 = st.columns(4)
with col1:
    if health.get("status") == "ok":
        st.success("🟢 Server Online")
    else:
        st.error("🔴 Server Offline")
with col2:
    if health.get("vector_db") == "ok":
        st.success("🟢 Vector DB")
    else:
        st.error("🔴 Vector DB")
with col3:
    st.info(f"📦 {health.get('chunks_indexed', 0)} Chunks")
with col4:
    provider = health.get("llm_provider", "?").upper()
    st.info(f"🤖 {provider}")

st.divider()

# ══════════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════════

with st.sidebar:
    st.title("⚙️ Konfigurasi Query")
    st.divider()

    # ── Pilih mesin ────────────────────────────────────────────────────────────
    machine_options = ["(Tidak difilter)"] + [f"M-{i:02d}" for i in range(1, 21)]
    selected        = st.selectbox("🏭 Filter Mesin", machine_options, index=0)
    machine_ids     = [] if selected == "(Tidak difilter)" else [selected]

    # ── Live context dari last_response ───────────────────────────────────────
    if machine_ids:
        st.subheader(f"📡 Live Context {machine_ids[0]}")
        lc = None
        if st.session_state.last_response:
            lcd = st.session_state.last_response.get("live_context_data") or []
            for item in lcd:
                if item.get("machine_id") == machine_ids[0]:
                    lc = item
                    break

        if lc:
            status = lc.get("status", "unknown")
            color  = {"healthy": "🟢", "warning": "🟡", "critical": "🔴"}.get(status, "⚪")
            st.metric("Status", f"{color} {status.upper()}")
            c1, c2 = st.columns(2)
            c1.metric("Suhu",    f"{lc.get('temperature_c', 'N/A')}°C")
            c2.metric("Getaran", f"{lc.get('vibration_mms', 'N/A')} mm/s")
            c1.metric("Tekanan", f"{lc.get('pressure_psi', 'N/A')} PSI")
            c2.metric("RUL",     f"{lc.get('rul_days', 'N/A')} hari")
            st.caption(f"Prediksi ML: **{lc.get('ml_prediction', 'N/A')}**")
            alerts = lc.get("active_alerts", [])
            if alerts:
                st.error("⚠️ " + " | ".join(alerts[:2]))
        else:
            st.info("Kirim query dengan mesin ini untuk melihat live context")

    st.divider()

    # ── Info session & API ────────────────────────────────────────────────────
    st.caption(f"🆔 Session: `{st.session_state.session_id}`")
    st.caption(f"🌐 API: `{API_BASE_URL}`")
    uptime = health.get("uptime_seconds", 0)
    if uptime:
        m, s = divmod(int(uptime), 60)
        st.caption(f"⏱️ Uptime: {m}m {s}s")

# ══════════════════════════════════════════════════════════════════════════════
# AREA UTAMA — QUERY INPUT
# ══════════════════════════════════════════════════════════════════════════════

st.subheader("💬 Tanya Lapis AI")

examples = [
    "Apa yang terjadi pada M-01 saat emergency?",
    "Berapa batas kritis suhu mesin M-01?",
    "Prosedur LOTO sebelum membuka panel motor",
    "Mesin mana yang paling sering short circuit?",
    "Bandingkan kondisi M-02 dan M-07",
]

st.write("**Contoh pertanyaan:**")
cols = st.columns(3)
for idx, ex in enumerate(examples[:3]):
    if cols[idx % 3].button(ex, key=f"ex_{idx}", use_container_width=True):
        st.session_state.query_input = ex
        st.rerun()

cols2 = st.columns(2)
for idx, ex in enumerate(examples[3:]):
    if cols2[idx % 2].button(ex, key=f"ex2_{idx}", use_container_width=True):
        st.session_state.query_input = ex
        st.rerun()

query = st.text_area(
    "Pertanyaan Anda:",
    value       = st.session_state.get("query_input", ""),
    height      = 80,
    placeholder = "Ketik pertanyaan tentang mesin atau prosedur...",
    key         = "query_text",
)

send_col, clear_col = st.columns([4, 1])
send_btn  = send_col.button(
    "🔍 Tanya Lapis AI", type="primary", use_container_width=True
)
clear_btn = clear_col.button("🗑️ Reset", use_container_width=True)

if clear_btn:
    st.session_state.chat_history  = []
    st.session_state.last_response = None
    st.session_state.query_input   = ""
    st.rerun()

# ══════════════════════════════════════════════════════════════════════════════
# LOGIC QUERY
# ══════════════════════════════════════════════════════════════════════════════

if send_btn and query.strip():
    with st.spinner("🤖 Lapis AI sedang menganalisis... (bisa 10–60 detik)"):
        history  = st.session_state.chat_history[-6:]
        response = query_api(
            query, machine_ids, st.session_state.session_id, history
        )

    if "error" in response:
        st.error(f"❌ {response['error']}")
    else:
        st.session_state.last_response = response
        st.session_state.chat_history.append(
            {"role": "user",      "content": query}
        )
        st.session_state.chat_history.append(
            {"role": "assistant", "content": response.get("answer", "")}
        )
        st.session_state.query_input = ""
        st.rerun()

# ══════════════════════════════════════════════════════════════════════════════
# TAMPILKAN HASIL
# ══════════════════════════════════════════════════════════════════════════════

if st.session_state.last_response:
    resp = st.session_state.last_response
    st.divider()

    # ── Info bar ───────────────────────────────────────────────────────────────
    info_cols = st.columns(4)
    info_cols[0].metric("Mode",     resp.get("mode", "?"))
    info_cols[1].metric("Provider", resp.get("provider_used", "?"))
    info_cols[2].metric("Latency",  f"{resp.get('latency_ms', 0) // 1000}s")
    info_cols[3].metric("Citations",len(resp.get("citations", [])))

    # ── Jawaban AI ─────────────────────────────────────────────────────────────
    st.subheader("💡 Jawaban Lapis AI")
    st.markdown(resp.get("answer", "_Tidak ada jawaban._"))

    # ── Action suggestions ─────────────────────────────────────────────────────
    actions = resp.get("action_suggestions", [])
    if actions:
        st.subheader("⚡ Saran Tindakan")
        for action in actions:
            st.markdown(f"- {action}")

    # ── Citation cards ─────────────────────────────────────────────────────────
    citations = resp.get("citations", [])
    if citations:
        st.subheader("📄 Sumber Referensi")
        cite_cols = st.columns(min(len(citations), 3))
        for idx, cite in enumerate(citations):
            col      = cite_cols[idx % 3]
            doc_type = cite.get("doc_type", "")
            icon     = "📋" if "maintenance" in doc_type else "📖"
            col.info(
                f"{icon} **{cite.get('source_doc', '?')}**\n\n"
                f"Halaman: **{cite.get('page', '?')}** | `{doc_type}`\n\n"
                f"Relevansi: `{cite.get('relevance', 0):.3f}`"
            )

    # ── Live context expander ──────────────────────────────────────────────────
    if resp.get("live_context_used") and resp.get("live_context_data"):
        with st.expander("📡 Data Sensor Real-time yang Digunakan", expanded=False):
            for lc in resp["live_context_data"]:
                status = lc.get("status", "unknown")
                color  = {"healthy":"🟢","warning":"🟡","critical":"🔴"}.get(status,"⚪")
                st.markdown(f"**{color} {lc.get('machine_id')} — {status.upper()}**")
                st.json(lc)

# ══════════════════════════════════════════════════════════════════════════════
# RIWAYAT PERCAKAPAN
# ══════════════════════════════════════════════════════════════════════════════

n_qa = len(st.session_state.chat_history) // 2
if n_qa > 0:
    with st.expander(f"🕒 Riwayat Percakapan ({n_qa} tanya-jawab)", expanded=False):
        for msg in st.session_state.chat_history:
            if msg["role"] == "user":
                st.markdown(f"**🧑 Teknisi:** {msg['content']}")
            else:
                preview = msg["content"][:200]
                st.markdown(f"**🤖 Lapis AI:** {preview}{'...' if len(msg['content']) > 200 else ''}")
            st.divider()
