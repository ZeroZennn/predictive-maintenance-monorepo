"use client";

import { UserCircle, Bot } from "lucide-react";
import type { MessageRole } from "@/types";
import { clsx } from "clsx";

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

export default function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role.toLowerCase() === "user";

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3 group">
        <div
          className={clsx(
            "max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg",
            "bg-[#2B3739] border border-lapis-border/50",
            "transition-all duration-200 hover:border-lapis-border"
          )}
        >
          <p className="text-sm text-[#E2F0F1] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
          {timestamp && (
            <p className="text-[10px] text-lapis-muted mt-1.5 text-right font-medium opacity-70">
              {timestamp}
            </p>
          )}
        </div>
        {/* Avatar icon kanan */}
        <div className="w-9 h-9 rounded-full bg-[#2B3739] border border-lapis-border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
          <UserCircle className="w-5 h-5 text-lapis-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 group">
      {/* Icon asisten (Star as per Figma) */}
      <div className="w-8 h-8 rounded-full bg-lapis-neon/10 border border-lapis-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-4 h-4 text-lapis-neon" />
      </div>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-xl",
          "bg-lapis-surface/40 backdrop-blur-sm border border-lapis-neon/30",
          "transition-all duration-200 hover:border-lapis-neon/50"
        )}
      >
        <p className="text-sm text-[#E2F0F1] leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
        {timestamp && (
          <p className="text-[10px] text-lapis-muted mt-2 font-medium opacity-70">
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
