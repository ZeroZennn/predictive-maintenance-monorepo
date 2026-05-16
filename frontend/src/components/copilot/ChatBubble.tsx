import { UserCircle, Bot } from "lucide-react";
import type { MessageRole } from "@/types";

interface ChatBubbleProps {
  role: MessageRole;
  content: string;
  timestamp?: string;
}

export default function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  if (role.toLowerCase() === "user") {
    return (
      <div className="flex items-start justify-end gap-3">
        <div
          className="max-w-[75%] rounded-2xl rounded-tr-sm
                     bg-lapis-surface border border-lapis-border
                     px-4 py-3"
        >
          <p className="text-sm text-lapis-text leading-relaxed">{content}</p>
          {timestamp && (
            <p className="text-[10px] text-lapis-muted mt-1 text-right">{timestamp}</p>
          )}
        </div>
        {/* Avatar icon kanan */}
        <div
          className="w-8 h-8 rounded-full bg-lapis-surface border border-lapis-border
                     flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <UserCircle className="w-4 h-4 text-lapis-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon bintang kiri */}
      <div
        className="w-8 h-8 rounded-full bg-lapis-neon/10 border border-[#5FDA0A]
                   flex items-center justify-center flex-shrink-0 mt-0.5"
      >
        <Bot className="w-4 h-4 text-lapis-neon" />
      </div>
      <div
        className="max-w-[75%] rounded-2xl rounded-tl-sm
                   bg-lapis-card border border-lapis-neon/40
                   px-4 py-3"
      >
        <p className="text-sm text-lapis-text leading-relaxed">{content}</p>
        {timestamp && (
          <p className="text-[10px] text-lapis-muted mt-1">{timestamp}</p>
        )}
      </div>
    </div>
  );
}
