import { CheckCircle2 } from "lucide-react";

export default function ProblemSection() {
  return (
    <section id="problem" className="w-full px-6 lg:px-24 xl:px-32 py-32 grid lg:grid-cols-2 gap-16 xl:gap-32 items-center bg-[#081819]">
      {/* Left: Naked Typography */}
      <div>
        <p className="text-[#EF4444] text-sm font-bold uppercase tracking-widest mb-4">The Reactive Past</p>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
          Era Industri 4.0: Banjir Data, Miskin Prediksi.
        </h2>
        <p className="text-[#C3CCD1] text-lg leading-relaxed mb-12">
          Fasilitas manufaktur masih terjebak pada corrective maintenance. Akibatnya, downtime mendadak menekan produktivitas hingga 20-30%. Menunggu mesin rusak bukanlah strategi.
        </p>

        <div className="flex gap-12">
          <div>
            <p className="text-4xl font-bold text-[#EF4444] mb-1">30%</p>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Productivity Loss</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-[#EF4444] mb-1">$260B</p>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Annual Cost</p>
          </div>
        </div>
      </div>

      {/* Right: 3D Isometric Floating Cards */}
      <div className="flex flex-col gap-6" style={{ perspective: '2000px' }}>
        {[
          { id: "01", title: "Zero Unplanned Downtime", desc: "Prediksi kegagalan mesin 14 hari sebelum terjadi." },
          { id: "02", title: "Data-Driven SOP Insights", desc: "AI merekomendasikan prosedur dari histori perbaikan." },
          { id: "03", title: "Automated Work Orders", desc: "Integrasi prediksi ke jadwal maintenance teknisi." }
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-[#5FDA0A]/10 via-[#0C2223]/80 to-[#081819]/90 backdrop-blur-md border-t border-l border-[#5FDA0A]/20 border-r-0 border-b-0 rounded-2xl p-8 transform transition-transform duration-700 ease-out hover:-translate-y-2 hover:rotate-x-2 hover:-rotate-y-5"
            style={{ transform: 'rotateY(-15deg) rotateX(5deg)' }}
          >
            <div className="text-[#5FDA0A] font-bold text-xl mb-2">{item.id}</div>
            <h3 className="text-white font-bold text-xl mb-2 flex items-center gap-2">
              {item.title} <CheckCircle2 size={18} className="text-[#5FDA0A]" />
            </h3>
            <p className="text-[#C3CCD1]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
