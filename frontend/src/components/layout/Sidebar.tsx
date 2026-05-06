"use client";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-lapis-surface border-r border-lapis-border fixed left-0 top-0 z-40 flex flex-col">
      <div className="p-4 border-b border-lapis-border">
        <span className="text-lapis-neon font-bold text-lg tracking-widest">
          LAPIS AI
        </span>
      </div>
      <nav className="flex-1 p-4">
        <p className="text-lapis-muted text-sm">Navigation — coming soon</p>
      </nav>
    </aside>
  );
}
