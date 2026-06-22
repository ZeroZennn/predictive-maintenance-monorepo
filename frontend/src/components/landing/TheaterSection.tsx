"use client";

import { useState } from "react";
import { Play } from "lucide-react";

export default function TheaterSection() {
  const features = [
    {
      id: "01",
      title: "Health Status Classifier",
      desc: "Klasifikasi real-time mendeteksi anomali mikroskopis secara instan. Ditenagai oleh model XGBoost untuk menentukan status komponen dalam kondisi Healthy, Warning, atau Critical sebelum degradasi meluas.",
      isActive: true, // Untuk simulasi visual scroll focus
    },
    {
      id: "02",
      title: "RUL Predictor Engine",
      desc: "Model Deep Learning LSTM menganalisis deret waktu temporal (telemetry history) 24-jam ke belakang untuk memprediksi Remaining Useful Life (sisa umur pakai) secara absolut sebelum kerusakan fatal terjadi.",
      isActive: false,
    },
    {
      id: "03",
      title: "AI Assistant (RAG)",
      desc: "SOP pabrik di ujung jari Anda. Asisten teknis cerdas berbasis LLM yang mengindeks dokumen panduan manual, memberikan rekomendasi perbaikan instan dan langkah troubleshooting berbasis konteks operasional.",
      isActive: false,
    },
    {
      id: "04",
      title: "Automated Scheduler",
      desc: "Menghasilkan work order secara otomatis langsung dari output prediksi ML yang kritis. Mengintegrasikan alarm kegagalan ke dalam manajemen jadwal perawatan berbentuk Kanban Board (Emergency, Corrective, Preventive).",
    },
  ];

  const visualData = [
    { bg: "from-[#0C2223] to-[#081819]", text: "GIF: 8 Gauge Cards (Health Status)" },
    { bg: "from-[#3D0808] to-[#081819]", text: "GIF: RUL Trend Graph (LSTM Model)" },
    { bg: "from-[#081C3D] to-[#081819]", text: "GIF: Chatbot Interface (RAG SOPs)" },
    { bg: "from-[#0C2321] to-[#081819]", text: "GIF: Kanban Board Scheduler" },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="features" className="w-full bg-gradient-to-b from-[#101617] to-[#081819] py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">
        
        {/* Left Column: The Scrolling Script */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-[35vh] pt-[15vh] pb-[70vh] order-2 lg:order-1">
          {features.map((item, idx) => (
            <div 
              key={idx} 
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => setActiveIndex(idx)}
              className={`transition-all duration-700 cursor-pointer ${activeIndex === idx ? "opacity-100 scale-100" : "opacity-30 hover:opacity-100"}`}
            >
              <span className="font-heading text-[#5FDA0A] text-2xl font-bold tracking-wider">{item.id}</span>
              <h3 className="font-heading text-white text-4xl font-extrabold mt-4 mb-6 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[#C3CCD1] text-lg leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column: The Sticky Theater Screen */}
        <div className="col-span-1 lg:col-span-7 lg:sticky lg:top-32 h-[50vh] lg:h-[80vh] flex items-center justify-center order-1 lg:order-2">
          <div className={`w-full aspect-video bg-gradient-to-br ${visualData[activeIndex].bg} backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_100px_rgba(95,218,10,0.03)] overflow-hidden relative flex flex-col items-center justify-center group cursor-pointer transition-colors duration-700`}>
            
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[#5FDA0A]/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Simulated Content Text */}
            <h2 className="font-heading text-2xl md:text-4xl text-white font-extrabold mb-8 relative z-10 text-center px-4 transition-all duration-500">
              {visualData[activeIndex].text}
            </h2>

            {/* Center Play Indicator */}
            <div className="w-20 h-20 rounded-full bg-[#081819]/80 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#5FDA0A]/50 group-hover:shadow-[0_0_30px_rgba(95,218,10,0.2)] transition-all duration-500 relative z-10">
              <Play className="text-[#5FDA0A] ml-1 transition-transform group-hover:translate-x-0.5" size={28} />
            </div>
            
            <p className="font-heading text-white font-medium tracking-widest text-sm uppercase relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
              Interactive Feature Preview
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
