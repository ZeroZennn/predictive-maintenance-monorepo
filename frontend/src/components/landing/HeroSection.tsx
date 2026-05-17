import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center pl-6 md:pl-16 lg:pl-24 xl:pl-32 pt-20 overflow-hidden">
      {/* Background Image & Gradient Blend */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
          alt="Industrial Tech Background"
          className="absolute top-0 right-0 w-full lg:w-2/3 h-full object-cover opacity-40 grayscale mix-blend-luminosity"
        />
        {/* Gradient to fade the left side into the dark background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#081819] via-[#081819]/95 via-55% to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#081819] to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
          Predictive Reliability & <br />
          <span className="text-[#5FDA0A]">Intelligence</span> Maintenance <br />
          Engine
        </h1>
        <p className="text-lg md:text-xl text-[#C3CCD1] max-w-2xl mb-10 leading-relaxed">
          Platform pemantauan kondisi mesin industrial yang memadukan prediksi hibrida ML/DL dan RAG Asisten Teknis dalam satu ekosistem terpadu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-[#5FDA0A] text-black font-bold rounded-full flex items-center justify-center gap-2 hover:bg-[#4bc208] transition-colors"
          >
            Mulai Pemantauan <ArrowRight size={20} />
          </Link>
          <a
            href="#features"
            className="px-8 py-4 border border-white/20 text-white font-bold rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            Pelajari Arsitektur
          </a>
        </div>
      </div>
    </section>
  );
}
