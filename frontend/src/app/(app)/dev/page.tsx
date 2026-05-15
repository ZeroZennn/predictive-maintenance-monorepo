"use client";

import { ChatBubble } from "@/components/copilot";

// ──────────────────────────────────────────
// HALAMAN INI HANYA UNTUK PREVIEW KOMPONEN
// Hapus atau disable sebelum production build
// Akses: http://localhost:3000/dev/components
// ──────────────────────────────────────────

const MOCK_CONVERSATION = [
  {
    role: "assistant" as const,
    content: "Halo! Saya Lapis AI. Ada yang bisa saya bantu mengenai kondisi mesin Anda saat ini?",
    timestamp: "14:00",
  },
  {
    role: "user" as const,
    content: "Tolong cek kondisi mesin M-01.",
    timestamp: "14:01",
  },
  {
    role: "assistant" as const,
    content:
      "Mesin M-01 saat ini dalam kondisi HEALTHY dengan confidence score 86%. Estimasi Remaining Useful Life (RUL) adalah 362 hari. Tidak ada anomali kritis yang terdeteksi dalam 1 jam terakhir.",
    timestamp: "14:01",
  },
  {
    role: "user" as const,
    content: "Apa yang perlu saya perhatikan dari sensor getaran M-01?",
    timestamp: "14:02",
  },
  {
    role: "assistant" as const,
    content:
      "Sensor getaran M-01 saat ini menunjukkan nilai 0.45 mm/s, masih dalam batas normal (<2.0 mm/s). Namun, ada tren kenaikan kecil dalam 3 hari terakhir. Disarankan untuk melakukan pengecekan bearing dalam 2 minggu ke depan sebagai tindakan preventif.",
    timestamp: "14:02",
  },
];

export default function ComponentPreviewPage() {
  return (
    <div className="min-h-screen bg-lapis-bg p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-lapis-border">
          <p className="text-xs text-lapis-amber uppercase tracking-widest font-mono mb-1">
            ⚠ Dev Preview — Hapus sebelum production
          </p>
          <h1 className="text-2xl font-bold text-lapis-text">Component Preview</h1>
          <p className="text-sm text-lapis-muted mt-1">
            Halaman sementara untuk melihat komponen yang sedang dikembangkan.
          </p>
        </div>

        {/* ChatBubble Preview */}
        <section className="mb-10">
          <h2 className="text-xs text-lapis-neon uppercase tracking-widest font-mono mb-4">
            ChatBubble — Atom
          </h2>
          <div className="bg-lapis-card border border-lapis-border rounded-2xl p-6 space-y-4">
            {MOCK_CONVERSATION.map((msg, i) => (
              <ChatBubble
                key={i}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
