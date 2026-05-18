"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Bot } from "lucide-react";
import { useCopilotStore } from "@/stores";
import { queryCopilot } from "@/lib/api";
import { ChatBubble, CitationChip, ChatInput } from "./index";
import { clsx } from "clsx";
import { usePathname } from "next/navigation";

export default function CopilotSlidingPanel() {
  // Surgical Subscriptions
  const messages = useCopilotStore((s) => s.messages);
  const isOpen = useCopilotStore((s) => s.isOpen);
  const isLoading = useCopilotStore((s) => s.isLoading);
  const togglePanel = useCopilotStore((s) => s.togglePanel);
  const activeMachineContext = useCopilotStore((s) => s.activeMachineContext);
  const addMessage = useCopilotStore((s) => s.addMessage);
  const setLoading = useCopilotStore((s) => s.setIsLoading);
  const generateId = useCopilotStore((s) => s.generateMessageId);

  const pathname = usePathname();
  const isCopilotHub = pathname === "/copilot-hub";

  // sessionId: generate sekali pakai
  const [sessionId] = useState(() => crypto.randomUUID());

  // Auto-scroll ke pesan terbaru
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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
        machine_id: activeMachineContext ?? undefined,
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
      console.error("[Copilot] Error:", err);
      addMessage({
        id: generateId(),
        role: "ASSISTANT",
        content: "Maaf, terjadi kesalahan saat menghubungi asisten AI. Silakan coba lagi nanti.",
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
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={togglePanel}
        className={clsx(
          "fixed bottom-6 right-6 z-40",
          "w-12 h-12 rounded-full",
          "bg-lapis-neon text-[#081819] transition-all duration-300",
          "flex items-center justify-center",
          "shadow-[0_0_20px_rgba(95,218,10,0.3)] hover:shadow-[0_0_30px_rgba(95,218,10,0.5)]",
          "hover:scale-110 active:scale-95 group",
          (isOpen || isCopilotHub) && "opacity-0 scale-0 pointer-events-none"
        )}
      >
        <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="copilot-panel"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 w-full sm:w-[400px] h-full bg-[#1A2121] border-l border-lapis-border flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-lapis-border bg-lapis-surface/80 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-lapis-neon/10 border border-lapis-neon/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-lapis-neon" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-wide">
                    AI CO-PILOT
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-lapis-neon animate-pulse" />
                    <span className="text-[10px] text-lapis-muted font-medium uppercase tracking-wider">
                      Online & Ready
                    </span>
                  </div>
                </div>
                {activeMachineContext && (
                  <span className="ml-1 text-[10px] px-2 py-0.5 rounded-md bg-lapis-neon/10 text-lapis-neon border border-lapis-neon/20 font-bold">
                    {activeMachineContext}
                  </span>
                )}
              </div>
              <button
                onClick={togglePanel}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-lapis-muted hover:text-white" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent bg-gradient-to-b from-transparent to-black/20">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                  <div className="w-16 h-16 rounded-full bg-lapis-border/20 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-lapis-muted" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-lapis-text uppercase tracking-widest mb-1">
                      Asisten SOP Lapis AI
                    </p>
                    <p className="text-[11px] text-lapis-muted max-w-[200px] leading-relaxed">
                      Tanyakan apa saja seputar prosedur maintenance atau kondisi mesin saat ini.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-2.5">
                  <ChatBubble
                    role={msg.role}
                    content={msg.content}
                    timestamp={msg.timestamp}
                  />
                  {/* CitationChips — hanya untuk assistant */}
                  {msg.role === "ASSISTANT" &&
                    msg.sources &&
                    msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 pl-11">
                        {msg.sources.map((src, i) => (
                          <CitationChip
                            key={i}
                            filename={src.filename}
                            page={src.page}
                          />
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-lapis-neon/10 border border-lapis-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-lapis-neon" />
                  </div>
                  <div className="bg-lapis-card border border-lapis-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-lapis-neon"
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

            {/* Input */}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bounce {
          to {
            transform: translateY(-4px);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}
