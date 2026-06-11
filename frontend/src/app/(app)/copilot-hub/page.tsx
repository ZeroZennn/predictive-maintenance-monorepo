"use client";

import React, { useState, useRef, useEffect } from "react";
import { queryCopilot } from "@/lib/api";
import {
  ChatBubble,
  CitationChip,
  ChatInput,
  SopDocumentPanel,
} from "@/components/copilot";
import { Bot } from "lucide-react";
import { useCopilotStore } from "@/stores";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

export default function CopilotHubPage() {
  // Surgical Subscriptions exactly like CopilotSlidingPanel
  const messages = useCopilotStore((s) => s.messages);
  const isLoading = useCopilotStore((s) => s.isLoading);
  const activeMachineContext = useCopilotStore((s) => s.activeMachineContext);
  const addMessage = useCopilotStore((s) => s.addMessage);
  const setLoading = useCopilotStore((s) => s.setIsLoading);
  const generateId = useCopilotStore((s) => s.generateMessageId);

  // Local Session for this component if needed, or we just rely on store session if available.
  // The user requirement says "Pastikan session_id dan history conversation ter-handle dengan cara yang sama"
  // CopilotSlidingPanel uses local state for session: const [sessionId] = useState(() => crypto.randomUUID());
  const [sessionId] = useState(() => crypto.randomUUID());
  const [previewTarget, setPreviewTarget] = useState<{documentId: string, filename: string} | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    if (isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Tambah user message ke store
    addMessage({
      id: generateId(),
      role: "USER",
      content: text,
      timestamp: timeStr,
    });

    setLoading(true);

    try {
      // 2. Panggil API
      const response = await queryCopilot({
        session_id: sessionId,
        query: text,
        machine_id: activeMachineContext || undefined,
      });

      // 3. Tambah assistant message dengan sources
      addMessage({
        id: generateId(),
        role: "ASSISTANT",
        content: response.reply,
        sources: response.sources ?? [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } catch (err) {
      console.error("[Copilot Hub] Error:", err);
      addMessage({
        id: generateId(),
        role: "ASSISTANT",
        content: "Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi.",
        sources: [],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-none p-4 gap-4 pb-24 md:pb-8">
      {/* Panel Kiri — Dokumen SOP */}
      <SopDocumentPanel />

      {/* Panel Kanan — Chat Area */}
      <div className="flex flex-col flex-1 overflow-hidden bg-lapis-surface/40 rounded-3xl border border-lapis-border shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-3.5 px-5 py-5 border-b border-lapis-border/50 bg-gradient-to-b from-[#2B3739] to-[#1C2626] flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-lapis-neon/10 border border-lapis-neon/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-lapis-neon" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-[0.25em] text-white">
              PRAM AI - Asisten Teknisi
            </span>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8 scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent bg-[#3D4A4C]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 opacity-20 grayscale">
              <div className="w-20 h-20 rounded-full bg-lapis-border/10 flex items-center justify-center border border-lapis-border/30">
                <Bot className="w-10 h-10 text-lapis-muted" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-lapis-muted">
                Tanyakan seputar prosedur maintenance
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-4">
              <ChatBubble
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
              {/* CitationChips — hanya untuk assistant */}
              {msg.role === "ASSISTANT" &&
                msg.sources &&
                msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-12 max-w-[520px]">
                    {msg.sources.map((src, i) => {
                      const filename = src.filename || src.source_doc || "Unknown Document";
                      const match = filename.match(/^(DOC-\d{8}-\d{3})/);
                      const docId = match ? match[1] : "";
                      return (
                        <CitationChip
                          key={i}
                          filename={filename}
                          page={src.page}
                          onClick={() => {
                            if (docId) {
                              setPreviewTarget({ documentId: docId, filename });
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-lapis-neon/10 border border-lapis-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-4 h-4 text-lapis-neon fill-none" />
              </div>
              <div className="bg-lapis-card/60 backdrop-blur-sm border border-lapis-border px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-lapis-neon"
                    style={{
                      animation: "bounce 0.6s infinite alternate",
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-2 bg-gradient-to-b from-[#2B3739] to-[#1C2626] border-t border-lapis-border/50 flex-shrink-0">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce {
          to {
            transform: translateY(-5px);
            opacity: 0.5;
          }
        }
      `}</style>
      
      {/* PREVIEW MODAL */}
      <DocumentPreviewModal
        isOpen={!!previewTarget}
        documentId={previewTarget?.documentId || ""}
        filename={previewTarget?.filename || ""}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  );
}
