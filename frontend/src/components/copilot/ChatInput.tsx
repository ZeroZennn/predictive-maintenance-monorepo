"use client";

import React, { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ChatInput({
  onSend,
  isLoading,
  placeholder,
  className,
}: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-4",
        "border-t border-lapis-border",
        "bg-lapis-surface/50 backdrop-blur-sm",
        className
      )}
    >
      <textarea
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder={placeholder ?? "Ketik pertanyaan SOP Anda..."}
        className={clsx(
          "flex-1 resize-none bg-[#1A2121] border border-lapis-border rounded-xl",
          "px-4 py-3 text-sm text-lapis-text",
          "placeholder:text-gray-500",
          "focus:outline-none focus:border-lapis-neon/40",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "max-h-[120px] scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent",
          "transition-all duration-200"
        )}
      />

      <button
        onClick={handleSend}
        disabled={isLoading || !text.trim()}
        className={clsx(
          "flex-shrink-0 flex items-center justify-center",
          "min-w-[80px] h-11 rounded-xl px-4",
          "bg-lapis-neon text-[#081819] font-bold text-xs uppercase tracking-wider",
          "hover:bg-lapis-neon/80 active:scale-95",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale",
          "transition-all duration-150 shadow-[0_0_15px_rgba(95,218,10,0.2)]"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "KIRIM"
        )}
      </button>
    </div>
  );
}
