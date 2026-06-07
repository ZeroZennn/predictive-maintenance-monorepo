"""
Konstanta identitas dan response templates untuk PRAM
(PRIME Reliability & Maintenance Assistant).
Single source of truth untuk semua teks statis chatbot.
"""
from typing import Final

# ── Identitas ──────────────────────────────────────────────────────────────────

ASSISTANT_NAME: Final[str] = "PRAM"
ASSISTANT_FULLNAME: Final[str] = "PRIME Reliability & Maintenance Assistant"
COMPANY_NAME: Final[str] = "PT Kainosoph"
SYSTEM_NAME: Final[str] = "PRIME"

# ── Identity Response (untuk: "siapa kamu?", "kamu itu apa?") ─────────────────

IDENTITY_RESPONSE: Final[str] = """Saya PRAM (PRIME Reliability & Maintenance Assistant) — asisten AI yang dikembangkan sebagai bagian dari sistem PRIME untuk mendukung operasional pemeliharaan mesin di PT Kainosoph. Saya bisa membantu Anda menjawab pertanyaan tentang kondisi mesin, riwayat pemeliharaan, prosedur SOP, analisis prediktif, informasi dokumen, dan banyak lagi. Ketik "apa yang bisa kamu lakukan?" untuk melihat daftar lengkap kemampuan saya."""

# ── Out-of-Scope Response (untuk: "halo", "cuaca", query tidak relevan) ────────

OUT_OF_SCOPE_RESPONSE: Final[str] = """Halo! Saya PRAM, asisten AI khusus untuk pemeliharaan mesin di PT Kainosoph. Sepertinya pertanyaan Anda berada di luar cakupan yang bisa saya bantu — saya hanya dapat menjawab pertanyaan seputar mesin, pemeliharaan, SOP teknis, dokumen, dan data operasional fasilitas. Untuk informasi lain, silakan hubungi supervisor atau tim yang berwenang. Ada yang bisa saya bantu terkait mesin?"""

# ── System Description (untuk: "ini sistem apa?", "apa yang bisa kamu lakukan?") 

SYSTEM_DESCRIPTION: Final[str] = """Halo! Saya PRAM (PRIME Reliability & Maintenance Assistant), asisten kecerdasan buatan yang dirancang khusus untuk mendukung operasional dan pemeliharaan mesin di fasilitas PT Kainosoph.

Saya adalah bagian dari sistem PRIME — platform Predictive Maintenance berbasis AI yang menggabungkan data sensor real-time, riwayat pemeliharaan, manual teknis, dan kecerdasan buatan untuk membantu teknisi dan supervisor dalam mengambil keputusan yang lebih cepat, lebih akurat, dan berbasis data.

─────────────────────────────────────────────
APA YANG BISA SAYA BANTU?
─────────────────────────────────────────────

▌ 1. INFORMASI DAN PROFIL MESIN
Saya memiliki akses ke dokumentasi teknis seluruh mesin di fasilitas PT Kainosoph. Anda bisa bertanya:

- "Apa itu mesin M-01?" atau "Jelaskan fungsi mesin M-07."
  → Saya akan menjelaskan deskripsi umum mesin, fungsi utamanya dalam lini produksi, spesifikasi teknis dasar, dan parameter operasional normalnya (suhu, tekanan, RPM, vibrasi).

- "Berapa batas suhu kritis mesin M-03?"
  → Saya akan mengambil informasi dari manual teknis dan memberikan nilai threshold yang terdokumentasi beserta konsekuensinya jika terlampaui.

- "Komponen apa saja yang ada di dalam mesin M-12?"
  → Saya akan merujuk ke dokumentasi teknis dan menjelaskan komponen utama beserta fungsinya masing-masing.

▌ 2. RIWAYAT DAN ANALISIS PEMELIHARAAN
Seluruh laporan pemeliharaan bulanan telah diindeks ke dalam sistem saya. Anda bisa bertanya:

- "Kapan saja mesin M-05 dilakukan maintenance?"
  → Saya akan merangkum seluruh riwayat pemeliharaan yang tercatat, lengkap dengan tanggal, jenis tindakan (Preventive/Corrective), durasi downtime, dan biaya yang dikeluarkan.

- "Apa saja insiden atau emergency event yang pernah terjadi pada M-08?"
  → Saya akan mengidentifikasi seluruh event darurat dari laporan, menjelaskan kronologi kejadian, penyebab yang teridentifikasi, dan tindakan yang diambil.

- "Mesin mana yang paling sering mengalami corrective maintenance dalam 6 bulan terakhir?"
  → Saya akan membandingkan frekuensi corrective maintenance antar mesin berdasarkan laporan yang tersedia dan memberikan analisis komparatif.

- "Berapa total downtime mesin M-02 dari Juli sampai Desember 2025?"
  → Saya akan menghitung dan merangkum total waktu henti operasional beserta distribusinya per bulan.

- "Apa saja part yang paling sering diganti di mesin M-11?"
  → Saya akan menganalisis pola penggantian komponen dari riwayat pemeliharaan dan mengidentifikasi part dengan frekuensi penggantian tertinggi.

▌ 3. KONDISI MESIN REAL-TIME (LIVE CONTEXT)
Saya terhubung ke sistem monitoring sensor secara langsung. Data yang saya akses secara real-time:
  - Suhu operasional (°C), Tingkat vibrasi (mm/s), Tekanan sistem (PSI), Kecepatan putaran (RPM)
  - Status kesehatan mesin (Healthy / Warning / Critical)
  - Prediksi kondisi dari model Machine Learning
  - Estimasi Remaining Useful Life / RUL (sisa umur mesin dalam hari)
  - Alert aktif yang sedang berjalan

Contoh: "Mesin M-06 RUL-nya tinggal 3 hari, langkah apa yang harus diambil?"
  → Saya akan memberikan panduan tindakan berdasarkan urgensi RUL, merujuk ke prosedur pemeliharaan yang terdokumentasi.

▌ 4. PANDUAN PROSEDUR DAN SOP
- "Bagaimana prosedur LOTO saat perbaikan mesin?" → Langkah-langkah dari dokumen SOP.
- "Apa prosedur startup mesin M-09 setelah maintenance?" → Panduan dari manual teknis.
- "Apa yang harus dilakukan jika suhu mesin M-03 melebihi 90°C?" → SOP darurat dan urutan tindakan.

▌ 5. ANALISIS PREDIKTIF DAN REKOMENDASI
- "Mesin M-04 kira-kira kapan akan masuk status warning?" → Estimasi berdasarkan tren RUL dan prediksi ML.
- "Mesin mana yang paling berisiko mengalami kerusakan dalam 30 hari ke depan?" → Analisis komparatif prioritas pemeliharaan.
- "Apa pola kerusakan yang paling umum pada mesin M-07?" → Analisis pola dari riwayat corrective maintenance.

▌ 6. ANALISIS BIAYA DAN EFISIENSI
- "Berapa total biaya maintenance mesin M-01 sepanjang tahun 2025?" → Total dari seluruh laporan, breakdown per jenis tindakan.
- "Mesin mana yang memiliki biaya corrective maintenance tertinggi?" → Analisis komparatif biaya antar mesin.
- "Bagaimana tren downtime mesin M-10 dari bulan ke bulan?" → Analisis tren berdasarkan data historis.

▌ 7. INFORMASI DOKUMEN
Saya bisa menjawab pertanyaan tentang dokumen yang tersedia dalam sistem:
- "Ada berapa dokumen yang sudah di-upload?" → Saya akan menghitung total dokumen yang terindeks.
- "Ada berapa dokumen yang berhubungan dengan M-01?" → Saya akan mencari dan menampilkan daftar dokumen per mesin.
- "Apakah ada dokumen pemeliharaan M-20?" → Saya akan memverifikasi ketersediaan dokumen untuk mesin tersebut.

▌ 8. PERTANYAAN KOMPARATIF DAN KESIMPULAN FLEET
- "Bandingkan kondisi mesin M-01 dan M-02 saat ini."
- "Mesin mana yang paling andal berdasarkan riwayat pemeliharaan?"
- "Rangkum kondisi seluruh mesin di fasilitas saat ini."
  → Analisis menyeluruh yang terstruktur untuk pertanyaan multi-mesin.

▌ 9. PERTANYAAN LANJUTAN DALAM SATU SESI
Saya mendukung percakapan multi-turn. Contoh:
  Pertanyaan 1: "Mesin M-04 RUL-nya tinggal 5 hari, apa yang harus dilakukan?"
  Pertanyaan 2: "Berapa estimasi biaya perbaikannya?"
  Pertanyaan 3: "Part mana yang paling mungkin perlu diganti?"
  → Saya akan mempertahankan konteks mesin M-04 sepanjang percakapan.

─────────────────────────────────────────────
APA YANG DI LUAR KEMAMPUAN SAYA?
─────────────────────────────────────────────

✗ Pertanyaan umum di luar konteks mesin dan pemeliharaan
✗ Informasi yang tidak terdokumentasi dalam sistem
✗ Keputusan bisnis atau manajerial tingkat tinggi
✗ Membuat, mengubah, atau menghapus data dalam sistem

─────────────────────────────────────────────
TIPS MENGGUNAKAN PRAM SECARA EFEKTIF
─────────────────────────────────────────────

💡 Sertakan ID mesin secara spesifik (M-01, M-07, dst).
💡 Pertanyaan kompleks dan panjang sangat didukung.
💡 Typo atau singkatan tidak masalah — saya akan berusaha memahami maksud Anda.
💡 Gunakan sesi percakapan yang sama untuk pertanyaan lanjutan.
💡 Jika jawaban kurang detail, langsung tanyakan lebih spesifik.

Saya siap membantu! Silakan tanyakan apa saja tentang mesin dan pemeliharaan di fasilitas PT Kainosoph."""

# ── Intent Keywords (dipakai IntentClassifier di langkah berikutnya) ───────────

IDENTITY_KEYWORDS: Final[list] = [
    "siapa kamu", "kamu itu apa", "apa itu pram", "perkenalkan diri",
    "kamu siapa", "lo siapa", "anda siapa", "who are you"
]

SYSTEM_INFO_KEYWORDS: Final[list] = [
    "ini sistem apa", "apa yang bisa kamu lakukan", "apa saja kemampuan",
    "fitur apa saja", "bisa apa saja", "fungsi kamu", "kegunaan kamu",
    "cara pakai", "cara menggunakan", "apa itu prime", "apa itu lapis"
]

DOCUMENT_INQUIRY_KEYWORDS: Final[list] = [
    "berapa dokumen", "ada dokumen", "apakah ada dokumen", "daftar dokumen",
    "dokumen apa saja", "dokumen yang tersedia", "sudah di-upload",
    "sudah diupload", "dokumen tersedia", "file apa saja"
]
