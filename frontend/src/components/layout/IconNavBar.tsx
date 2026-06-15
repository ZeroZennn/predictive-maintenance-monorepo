"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Bot,
  Calendar,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  ClipboardList,
  Terminal,
  Settings2,
  Sliders,
  Bell
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/config";
import { clsx } from "clsx";
import { useSimulatorStore, useToastStore } from "@/stores";

const TECHNICIAN_NAV_ITEMS = [
  { icon: LayoutDashboard, href: ROUTES.DASHBOARD, label: "Dashboard" },
  { icon: Bot, href: ROUTES.COPILOT_HUB, label: "AI Copilot" },
  { icon: Calendar, href: ROUTES.SCHEDULER, label: "Scheduler" },
  { icon: ClipboardList, href: ROUTES.LOGS, label: "Reports" },
  { icon: Terminal, href: ROUTES.DEBUG, label: "Debug Stream" },
];

const ADMIN_NAV_ITEMS = [
  { icon: LayoutDashboard, href: ROUTES.ADMIN, label: "Dashboard" },
  { icon: Users, href: ROUTES.ADMIN_USERS, label: "Users" },
  { icon: FileText, href: ROUTES.ADMIN_DOCUMENTS, label: "Docs" },
  { icon: ClipboardList, href: ROUTES.LOGS, label: "Reports" },
  { icon: Terminal, href: ROUTES.DEBUG, label: "Debug Stream" },
];

export default function IconNavBar() {
  const pathname = usePathname();

  const [role, setRole] = useState<string>("TECHNICIAN");

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )lapis_token=([^;]+)'));
    if (match && match[2]) {
      try {
        const token = match[2];
        const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadBase64));
        if (payload && payload.role) {
          setRole(payload.role.toUpperCase());
        }
      } catch (e) {
        console.error("Failed to parse token in nav", e);
      }
    }
  }, []);

  const navItems = role === "ADMIN" ? ADMIN_NAV_ITEMS : TECHNICIAN_NAV_ITEMS;

  const toggleSimulator = useSimulatorStore((state) => state.togglePanel);
  const unreadCount = useToastStore((s) => s.alerts.filter((a) => !a.isDismissed).length);

  return (
    <nav
      className={clsx(
        "fixed z-50 bg-[#081819] md:bg-transparent border-t md:border-t-0 border-lapis-border md:border-none",
        // Mobile layout: bottom bar
        "bottom-0 left-0 w-full h-[70px] flex flex-row items-center justify-around px-2",
        // Desktop layout: left sidebar
        "md:top-0 md:h-screen md:w-[90px] md:flex-col md:justify-start md:py-4 md:gap-2"
      )}
    >
      {/* Logo */}
      <div className="hidden md:block mb-6 shrink-0">
        <img
          src="/logo/PRIME_LOGO.png"
          alt="PRIME Logo"
          className="w-12 h-12 object-contain"
        />
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-row md:flex-col items-center justify-around md:justify-center gap-2 w-full md:w-auto">
        {navItems.map(({ icon: Icon, href, label }) => {
          const isActive = pathname === href || (href === ROUTES.DASHBOARD && pathname.startsWith("/dashboard")) || (href === ROUTES.ADMIN && pathname === "/admin");
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={clsx(
                "w-[60px] md:w-[70px] rounded-lg py-1 md:py-2 border",
                "flex flex-col items-center justify-center gap-0.5",
                "transition-all duration-200",
                "group relative",
                isActive
                  ? "bg-gradient-to-b from-[#2B3739] to-[#1C2626] border-lapis-neon text-lapis-neon"
                  : "border-transparent text-lapis-muted hover:text-lapis-text hover:bg-lapis-card hover:border-lapis-border"
              )}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 md:-left-2 md:top-1/2 md:-translate-y-1/2 md:-translate-x-0 w-6 h-[2px] md:w-[3px] md:h-6 bg-lapis-neon rounded-full shadow-glow-neon" />
              )}

              <Icon size={16} />
              <span
                className="text-[9px] mt-0.5 leading-tight text-center truncate w-full px-1"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Settings & Simulator di bottom / sisi kanan pada mobile */}
      <div className="mt-0 md:mt-auto flex md:flex-col gap-2 relative">
        <Link
          href="/alerts"
          className={clsx(
            "w-10 h-10 md:w-12 md:h-12 rounded-lg",
            "flex items-center justify-center relative",
            "transition-all duration-200 group",
            pathname === "/alerts"
              ? "bg-gradient-to-b from-[#2B3739] to-[#1C2626] border border-lapis-neon text-lapis-neon"
              : "border border-transparent text-lapis-muted hover:text-lapis-text hover:bg-lapis-card hover:border-lapis-border"
          )}
          title="Notification Alerts"
        >
          <Bell size={16} className={unreadCount > 0 ? "text-white" : ""} />
          {unreadCount > 0 && (
            <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-lg border border-[#081819] animate-pulse">
              {unreadCount}
            </div>
          )}
        </Link>
        <button
          onClick={toggleSimulator}
          className={clsx(
            "w-10 h-10 md:w-12 md:h-12 rounded-lg",
            "flex items-center justify-center",
            "text-amber-400 hover:text-white hover:bg-amber-400/20",
            "transition-all duration-200 cursor-pointer"
          )}
          title="Simulator Control Panel"
        >
          <Sliders size={16} />
        </button>
        <Link
          href={ROUTES.SETTINGS}
          className={clsx(
            "w-10 h-10 md:w-12 md:h-12 rounded-lg",
            "flex items-center justify-center",
            "transition-all duration-200 group relative",
            pathname === ROUTES.SETTINGS
              ? "bg-gradient-to-b from-[#2B3739] to-[#1C2626] border border-lapis-neon text-lapis-neon"
              : "border border-transparent text-lapis-muted hover:text-lapis-text hover:bg-lapis-card hover:border-lapis-border"
          )}
          title="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>
    </nav>
  );
}
