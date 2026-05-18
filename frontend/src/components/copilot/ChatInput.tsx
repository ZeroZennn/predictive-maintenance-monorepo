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
    <div //EDIT DISINI UNTUK CHATINPUT
      className={clsx(
        "flex items-center gap-4 p-3",
        "border-t border-none",
        " backdrop-blur-md",
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
          "flex-1 resize-none bg-[#101617] border border-lapis-border rounded-xl",
          "px-5 py-3 text-sm text-white",
          "placeholder:text-lapis-muted placeholder:opacity-50",
          "focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "max-h-[150px] scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent",
          "transition-all duration-200 shadow-inner"
        )}
      />

      <button
        onClick={handleSend}
        disabled={isLoading || !text.trim()}
        className={clsx(
          "flex-shrink-0 flex items-center justify-center",
          "min-w-[100px] h-12 rounded-xl px-6",
          "bg-lapis-neon text-[#081819] font-bold text-sm uppercase tracking-widest",
          "hover:bg-lapis-neon/90 hover:scale-[1.02] active:scale-95",
          "disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale",
          "transition-all duration-150 shadow-[0_0_20px_rgba(95,218,10,0.25)]"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "KIRIM"
        )}
      </button>
    </div>
  );
}
