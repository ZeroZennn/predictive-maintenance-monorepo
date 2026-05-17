import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-6 bg-[#081819]/80 backdrop-blur-md border-b border-white/5">
      <div className="text-2xl font-black tracking-tight">
        PRIME<span className="text-[#5FDA0A]">.</span>
      </div>
      <div className="hidden md:flex gap-8 text-sm font-medium text-[#C3CCD1]">
        <a href="#problem" className="hover:text-white transition-colors">
          The Gap
        </a>
        <a href="#features" className="hover:text-white transition-colors">
          Core Engine
        </a>
        <a href="#tech" className="hover:text-white transition-colors">
          Tech Stack
        </a>
      </div>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 text-sm font-bold text-[#5FDA0A] border border-[#5FDA0A]/50 rounded-full hover:bg-[#5FDA0A]/10 transition-colors"
      >
        Access Dashboard
      </Link>
    </nav>
  );
}
