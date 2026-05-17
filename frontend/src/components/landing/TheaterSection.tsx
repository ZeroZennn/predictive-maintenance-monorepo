import { Play } from "lucide-react";

export default function TheaterSection() {
  return (
    <section id="features" className="w-full bg-gradient-to-b from-[#101617] to-[#081819] py-32">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 relative">

        {/* Left: The Scrolling Script */}
        <div className="col-span-1 lg:col-span-5 flex flex-col gap-[30vh] py-[10vh] order-2 lg:order-1">

          {/* Feature 1 */}
          <div className="opacity-100 transition-opacity duration-500">
            <span className="text-[#5FDA0A] text-xl font-bold">01</span>
            <h3 className="text-white text-4xl font-extrabold mt-4 mb-6">Health Status Classifier</h3>
            <p className="text-[#C3CCD1] text-lg leading-relaxed">
              Klasifikasi real-time mendeteksi anomali mikroskopis. Ditenagai oleh model XGBoost V2 dengan akurasi tinggi untuk menentukan status Healthy, Warning, atau Critical.
            </p>
          </div>

          {/* Feature 2 (Inactive state simulasinya dibuat opacity-40 default, bisa diatur scroll-spy nanti) */}
          <div className="opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
            <span className="text-gray-500 text-xl font-bold">02</span>
            <h3 className="text-white text-4xl font-extrabold mt-4 mb-6">RUL Predictor Engine</h3>
            <p className="text-[#C3CCD1] text-lg leading-relaxed">
              Model Deep Learning LSTM menganalisis deret waktu temporal 24-jam untuk memprediksi Remaining Useful Life secara presisi sebelum kerusakan terjadi.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
            <span className="text-gray-500 text-xl font-bold">03</span>
            <h3 className="text-white text-4xl font-extrabold mt-4 mb-6">AI Copilot (RAG)</h3>
            <p className="text-[#C3CCD1] text-lg leading-relaxed">
              SOP pabrik di ujung jari Anda. Asisten teknis cerdas yang menganalisis dokumen panduan dan memberikan rekomendasi perbaikan instan.
            </p>
          </div>

        </div>

        {/* Right: The Sticky Screen */}
        <div className="col-span-1 lg:col-span-7 lg:sticky top-32 h-[50vh] lg:h-[80vh] flex items-center justify-center order-1 lg:order-2">
          <div className="w-full aspect-video bg-gradient-to-br from-[#0C2223]/40 to-[#081819]/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_0_80px_rgba(95,218,10,0.05)] overflow-hidden relative flex flex-col items-center justify-center group cursor-pointer">
            {/* Nanti ganti div ini dengan <img src="/dashboard-preview.gif" /> */}
            <div className="w-20 h-20 rounded-full bg-[#5FDA0A]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Play className="text-[#5FDA0A] ml-2" size={32} />
            </div>
            <p className="text-[#C3CCD1] font-medium tracking-wide">Interactive Preview</p>
          </div>
        </div>

      </div>
    </section>
  );
}
