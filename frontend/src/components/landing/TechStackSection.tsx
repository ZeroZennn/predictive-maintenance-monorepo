export default function TechStackSection() {
  return (
    <section id="tech" className="w-full py-40 flex flex-col items-start overflow-hidden bg-[#081819] px-6 lg:px-12">
      <p className="text-[#5FDA0A] text-sm font-bold uppercase tracking-widest mb-12 ml-4">Built for Industrial Scale</p>

      {["PYTHON", "TENSORFLOW", "FASTAPI", "NEXT.JS", "TIMESCALEDB"].map((tech, idx) => (
        <h2
          key={idx}
          className="text-6xl md:text-[8rem] lg:text-[11rem] font-heading font-black uppercase leading-[0.85] tracking-tighter text-[#1E3D40] hover:text-[#5FDA0A] hover:translate-x-8 transition-all duration-500 cursor-default"
        >
          {tech}
        </h2>
      ))}
    </section>
  );
}
