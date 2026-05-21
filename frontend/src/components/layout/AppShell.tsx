"use client";

import IconNavBar from "./IconNavBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <IconNavBar />
      {/* Konten digeser 90px dari kiri di desktop, beri jarak bawah di mobile untuk bottom nav */}
      <div className="md:ml-[90px] pb-[70px] md:pb-0 min-h-screen">{children}</div>
    </div>
  );
}
