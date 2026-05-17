"use client";

import React from "react";
import { FileText } from "lucide-react";
import { clsx } from "clsx";

interface CitationCardProps {
  filename: string;
  page?: number | null;
  onClick?: () => void;
}

export default function CitationCard({
  filename,
  page,
  onClick,
}: CitationCardProps) {
  // Derive label and extension
  const label = filename.replace(/\.[^/.]+$/, "");
  const ext = filename.split(".").pop()?.toLowerCase();

  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 w-full",
        "px-4 py-3 rounded-xl",
        "bg-[#1C2626] border border-lapis-border/30",
        "hover:bg-lapis-neon/10 hover:border-lapis-neon/40",
        "transition-all duration-200 text-left",
        "cursor-pointer group shadow-sm"
      )}
    >
      {/* Icon container */}
      <div className="w-10 h-10 rounded-lg bg-none border border-lapis-border/50 flex items-center justify-center flex-shrink-0 group-hover:bg-lapis-neon/20 group-hover:border-lapis-neon/30 transition-colors">
        <FileText className="w-5 h-5 text-lapis-muted group-hover:text-lapis-neon" />
      </div>

      {/* Text content */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-white truncate group-hover:text-lapis-neon transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-lapis-muted uppercase tracking-wider">
            {ext ?? "DOC"}
          </span>
          {page && (
            <>
              <span className="w-1 h-1 rounded-full bg-lapis-border" />
              <span className="text-[10px] text-lapis-muted font-medium">
                Halaman {page}
              </span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
