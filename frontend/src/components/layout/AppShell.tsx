"use client";

import IconNavBar from "./IconNavBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-lapis-bg">
      <IconNavBar />
      {/* Konten digeser 90px dari kiri */}
      <div className="ml-[90px] min-h-screen">{children}</div>
    </div>
  );
}
