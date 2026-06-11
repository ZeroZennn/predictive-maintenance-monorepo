"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, FileText, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { fetchDocuments } from "@/lib/api/admin.api";
import type { AdminDocument } from "@/types";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

export default function SopDocumentPanel() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTarget, setPreviewTarget] = useState<AdminDocument | null>(null);

  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await fetchDocuments();
        // Hanya tampilkan dokumen yang sudah ready / indexed
        const readyDocs = data.filter((d) => d.status.toUpperCase() === "READY" || d.status.toUpperCase() === "INDEXED");
        setDocuments(readyDocs);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDocs();
  }, []);

  return (
    <>
      <div className="flex flex-col h-[200px] lg:h-full w-full lg:w-[360px] flex-shrink-0 bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-2xl border border-lapis-border overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-lapis-border flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-lapis-neon/10 border border-lapis-neon/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-lapis-neon" />
          </div>
          <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
            DAFTAR DOKUMEN
          </span>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-[#607070] scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-lapis-neon animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <FileText className="w-8 h-8 text-lapis-muted mb-2" />
              <p className="text-sm font-medium text-lapis-text">Belum ada dokumen</p>
            </div>
          ) : (
            documents.map((doc, index) => (
              <div
                key={doc.document_id}
                onClick={() => setPreviewTarget(doc)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2",
                  "rounded-lg bg-[#607070] border border-lapis-border/30",
                  "hover:border-lapis-neon/40 hover:bg-[#253232]",
                  "transition-all duration-200 cursor-pointer group relative"
                )}
              >
                {/* Number */}
                <div className="absolute top-1.5 right-2.5 text-[9px] font-bold text-lapis-surface group-hover:text-lapis-neon/50 transition-colors">
                  {index + 1}
                </div>

                {/* File icon */}
                <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1C2626] group-hover:text-lapis-neon transition-colors" />
                </div>

                {/* File info */}
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-xs font-semibold text-white truncate group-hover:text-lapis-neon transition-colors" title={doc.filename}>
                    {doc.filename}
                  </span>
                  <span className="text-[10px] text-white/70 mt-0.5 group-hover:text-lapis-neon/70 transition-colors">
                    {new Date(doc.uploaded_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={!!previewTarget}
        documentId={previewTarget?.document_id || ""}
        filename={previewTarget?.filename || ""}
        onClose={() => setPreviewTarget(null)}
      />
    </>
  );
}
