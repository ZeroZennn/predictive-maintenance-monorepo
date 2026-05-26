"use client";

import React from "react";
import { BookOpen, FileText } from "lucide-react";
import { clsx } from "clsx";

// MOCK DATA (hardcode untuk sekarang, swap ke API Fase 13)
const MOCK_DOCUMENTS = Array.from({ length: 7 }, (_, i) => ({
  id: `doc-${i + 1}`,
  filename: `SOP-0${i + 1}_M-0${i + 1}_Rev2.pdf`,
  revised_at: "25/4/2026",
}));

export default function SopDocumentPanel() {
  return (
    <div className="flex flex-col h-[200px] lg:h-full w-full lg:w-[360px] flex-shrink-0 bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-2xl border border-lapis-border overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-lapis-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-lapis-neon/10 border border-lapis-neon/30 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-lapis-neon" />
        </div>
        <span className="text-sm font-bold uppercase tracking-[0.15em] text-white">
          DOKUMEN SOP M-01 s/d M-20
        </span>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-[#607070] scrollbar-track-transparent">
        {MOCK_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className={clsx(
              "flex items-center gap-3 px-4 py-3.5",
              "rounded-xl bg-[#607070] border border-lapis-border/30",
              "hover:border-lapis-neon/40 hover:bg-[#253232]",
              "transition-all duration-200 cursor-pointer group"
            )}
          >
            {/* File icon */}
            <div className="w-11 h-11 rounded-lg bg-none border border-none flex items-center justify-center flex-shrink-0 group-hover:border-lapis-neon/30 transition-colors">
              <FileText className="w-7 h-7 text-[#1C2626] group-hover:text-lapis-neon transition-colors" />
            </div>

            {/* File info */}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate group-hover:text-lapis-neon transition-colors">
                {doc.filename}
              </span>
              <span className="text-[11px] text-white mt-0.5 group-hover:text-lapis-neon transition-colors">
                Revisi : {doc.revised_at}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
