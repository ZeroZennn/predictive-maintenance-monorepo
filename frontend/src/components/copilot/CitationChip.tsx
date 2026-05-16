import { FileText, FileType, File } from "lucide-react";
import { clsx } from "clsx";

interface CitationChipProps {
  filename: string;     // "SOP_Maintenance_V1.pdf"
  page?: number | null; // nomor halaman, opsional
  onClick?: () => void; // opsional: buka preview dokumen
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return FileText;
  if (ext === "docx" || ext === "doc") return FileType;
  return File;
}

export default function CitationChip({ filename, page, onClick }: CitationChipProps) {
  // "SOP_Maintenance_V1.pdf" → "SOP_Maintenance_V1"
  const label = filename.replace(/\.[^/.]+$/, "");
  const Icon = getFileIcon(filename);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5",
        "px-2.5 py-1 rounded-md",
        "bg-lapis-neon/10 border border-lapis-neon/30",
        "text-lapis-neon text-[10px] font-medium",
        "hover:bg-lapis-neon/20 hover:border-lapis-neon/60",
        "transition-all duration-150",
        "max-w-[180px]",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      {/* Icon file sesuai ekstensi */}
      <Icon className="w-3 h-3 flex-shrink-0" />

      {/* Nama file — truncate jika terlalu panjang */}
      <span className="truncate">{label}</span>

      {/* Nomor halaman jika ada */}
      {page && (
        <span className="flex-shrink-0 text-lapis-muted">· hal. {page}</span>
      )}
    </button>
  );
}
