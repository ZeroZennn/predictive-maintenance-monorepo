"use client";

import {
  LayoutDashboard,
  Bot,
  Calendar,
  FileText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { icon: LayoutDashboard, href: ROUTES.DASHBOARD, label: "Dashboard" },
  { icon: Bot, href: ROUTES.COPILOT_HUB, label: "AI Copilot" },
  { icon: Calendar, href: ROUTES.SCHEDULER, label: "Scheduler" },
  { icon: FileText, href: ROUTES.LOGS, label: "Logs" },
  { icon: ShieldCheck, href: ROUTES.ADMIN, label: "Admin" },
];

export default function IconNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "fixed left-0 top-0 h-screen w-[90px] z-50",
        "bg-transparent",
        "flex flex-col items-center py-4 gap-2"
      )}
    >
      {/* Logo dot */}
      <div className="w-5 h-5 rounded-full bg-lapis-neon shadow-glow-neon mb-4 shrink-0" />

      {/* Nav items */}
      {NAV_ITEMS.map(({ icon: Icon, href, label }) => {
        const isActive = pathname === href || (href === ROUTES.DASHBOARD && pathname.startsWith("/dashboard"));
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={clsx(
              "w-[70px] rounded-lg py-2",
              "flex flex-col items-center justify-center gap-0.5",
              "transition-all duration-200",
              "group relative",
              isActive
                ? "bg-lapis-neon-dim text-lapis-neon"
                : "text-lapis-muted hover:text-lapis-text hover:bg-lapis-card"
            )}
          >
            <Icon size={16} />
            <span
              className="text-[9px] mt-0.5 leading-tight text-center truncate w-full px-1"
            >
              {label}
            </span>
          </Link>
        );
      })}

      {/* Settings di bottom */}
      <div className="mt-auto">
        <button
          className={clsx(
            "w-12 h-12 rounded-lg",
            "flex items-center justify-center",
            "text-lapis-muted hover:text-lapis-text hover:bg-lapis-card",
            "transition-all duration-200"
          )}
        >
          <Settings size={16} />
        </button>
      </div>
    </nav>
  );
}
