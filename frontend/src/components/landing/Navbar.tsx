"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Check login state via cookie
    const hasToken = document.cookie.includes("lapis_token");
    const bypassAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
    setIsLoggedIn(hasToken || bypassAuth);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-6 transition-all duration-300",
        isScrolled
          ? "bg-[#081819]/90 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="text-2xl font-heading font-black tracking-tight">
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
      {isLoggedIn ? (
        <Link
          href="/dashboard"
          className="px-5 py-2.5 text-sm font-bold text-[#5FDA0A] border border-[#5FDA0A]/50 rounded-full hover:bg-[#5FDA0A]/10 transition-colors"
        >
          Access Dashboard
        </Link>
      ) : (
        <Link
          href="/login"
          className="px-5 py-2.5 text-sm font-bold text-[#5FDA0A] border border-[#5FDA0A]/50 rounded-full hover:bg-[#5FDA0A]/10 transition-colors"
        >
          Login
        </Link>
      )}
    </nav>
  );
}
