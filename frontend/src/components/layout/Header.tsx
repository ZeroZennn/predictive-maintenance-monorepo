"use client";

export default function Header() {
  return (
    <header className="bg-lapis-surface/80 backdrop-blur-sm border-b border-lapis-border h-14 fixed top-0 right-0 w-[calc(100%-16rem)] z-30 flex items-center justify-between px-6">
      <span className="text-lapis-text font-medium">Dashboard</span>
      <span className="text-lapis-muted text-sm">User Panel — coming soon</span>
    </header>
  );
}
