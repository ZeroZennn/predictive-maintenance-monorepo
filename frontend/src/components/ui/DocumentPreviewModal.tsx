"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Loader2 } from "lucide-react";
import apiClient from "@/lib/api/axios-instance";

interface DocumentPreviewModalProps {
  documentId: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreviewModal({
  documentId,
  filename,
  isOpen,
  onClose,
}: DocumentPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      let isMounted = true;
      setIsLoading(true);
      setError(null);

      // Fetch as blob
      apiClient
        .get(`/api/admin/documents/${documentId}/serve`, {
          responseType: "blob",
        })
        .then((res) => {
          if (!isMounted) return;
          const url = URL.createObjectURL(res.data);
          setObjectUrl(url);
          setIsLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.error("Failed to load document:", err);
          setError("Gagal memuat dokumen. Mungkin file telah dihapus.");
          setIsLoading(false);
        });

      return () => {
        isMounted = false;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    } else {
      setObjectUrl(null);
    }
  }, [isOpen, documentId]);

  const handleDownload = async () => {
    try {
      const res = await apiClient.get(
        `/api/admin/documents/${documentId}/serve?download=1`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Gagal mendownload dokumen.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-[95vw] h-[95vh] max-w-6xl bg-lapis-card border border-lapis-border rounded-2xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-lapis-card to-[#1C2626] border-b border-lapis-border flex-shrink-0">
              <h2 className="text-lg font-bold text-white truncate max-w-[70%]">
                {filename}
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lapis-neon/10 text-lapis-neon border border-lapis-neon/30 hover:bg-lapis-neon hover:text-[#081819] transition-colors text-sm font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-lapis-muted hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 w-full h-full bg-[#1A2121] relative flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A2121]">
                  <Loader2 className="w-10 h-10 text-lapis-neon animate-spin mb-4" />
                  <p className="text-lapis-muted text-sm animate-pulse">Memuat dokumen...</p>
                </div>
              )}
              
              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A2121] p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-medium">{error}</p>
                </div>
              )}

              {objectUrl && !isLoading && !error && (
                <iframe
                  src={objectUrl}
                  className="w-full h-full border-none"
                  title={filename}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
