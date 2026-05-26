"use client";

import { useEffect, useState } from "react";
import {
  User,
  Moon,
  Sun,
  Bell,
  Database,
  Globe,
  LogOut,
  ShieldCheck,
  Clock,
  ChevronRight
} from "lucide-react";
import { logoutAction } from "./actions";

interface UserProfile {
  username?: string;
  email?: string;
  role?: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Parse user from JWT on client side
  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )lapis_token=([^;]+)'));
    if (match && match[2]) {
      try {
        const token = match[2];
        const payloadBase64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(payloadBase64));
        setUser(payload);
      } catch (e) {
        console.error("Failed to parse token in settings", e);
      }
    }
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-lapis-background p-4 md:p-8 text-lapis-text">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">

        <div className="flex flex-col gap-2 border-b border-lapis-border pb-6">
          <h1 className="text-3xl font-bold text-lapis-neon">Settings</h1>
          <p className="text-lapis-muted">Manage your account preferences, system behavior, and visual appearance.</p>
        </div>

        {/* ACCOUNT SECTION */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <User size={20} className="text-lapis-neon" />
            Account & Profile
          </h2>
          <div className="bg-lapis-surface border border-lapis-border rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lapis-neon/20 to-lapis-surface border border-lapis-neon flex items-center justify-center text-2xl font-bold text-lapis-neon">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.username || "Loading..."}</h3>
                <p className="text-sm text-lapis-muted">{user?.email || "..."}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-lapis-neon/10 text-lapis-neon border border-lapis-neon/30">
                  <ShieldCheck size={12} />
                  {user?.role?.toUpperCase() || "UNKNOWN"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer px-6 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 transition-all font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </section>

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-lapis-surface border border-lapis-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-white mb-2">Sign Out</h3>
              <p className="text-lapis-muted text-sm mb-6">
                Are you sure you want to sign out? You will need to log in again to access the dashboard.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg font-medium text-lapis-muted hover:text-white hover:bg-lapis-card transition-colors"
                >
                  Cancel
                </button>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 hover:border-red-500 transition-all"
                  >
                    Yes, Sign Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE SECTION */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Moon size={20} className="text-lapis-neon" />
            Appearance
          </h2>
          <div className="bg-lapis-surface border border-lapis-border rounded-xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-lapis-muted">Theme</h3>
              <div className="flex gap-4">
                <button className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-lapis-neon bg-[#1C2626] text-white cursor-pointer">
                  <Moon size={24} className="text-lapis-neon" />
                  <span className="text-sm font-medium">Dark Mode</span>
                  <span className="text-[10px] text-lapis-neon">Active</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-transparent bg-lapis-background text-lapis-muted opacity-50 cursor-not-allowed " disabled title="Coming Soon">
                  <Sun size={24} />
                  <span className="text-sm font-medium">Light Mode</span>
                  <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Planned</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-lapis-muted">Language</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-lapis-background border border-lapis-border cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-lapis-neon" />
                    <span className="text-sm text-white">English (US)</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-lapis-neon shadow-glow-neon"></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-lapis-background/50 border border-transparent opacity-60">
                  <div className="flex items-center gap-3">
                    <Globe size={18} className="text-lapis-muted" />
                    <span className="text-sm text-lapis-muted">Bahasa Indonesia</span>
                  </div>
                  <span className="text-[10px] text-amber-500 font-medium">Coming Soon</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* NOTIFICATIONS & PREFERENCES */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bell size={20} className="text-lapis-neon" />
            Notifications & System
          </h2>
          <div className="bg-lapis-surface border border-lapis-border rounded-xl shadow-xl overflow-hidden divide-y divide-lapis-border">

            <div className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-white">Critical Alerts Notification</h3>
                <p className="text-sm text-lapis-muted mt-1">Receive system toast alerts and sound chimes when a machine hits CRITICAL.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lapis-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lapis-neon"></div>
              </label>
            </div>

            <div className="p-4 md:p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-medium text-white">Predictive Maintenance Reminders</h3>
                <p className="text-sm text-lapis-muted mt-1">Get early warnings when ML Model detects anomalies (WARNING status).</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-lapis-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lapis-neon"></div>
              </label>
            </div>

            <div className="p-4 md:p-6 flex items-center justify-between gap-4 group cursor-pointer hover:bg-lapis-card transition-colors">
              <div className="flex items-center gap-3">
                <Database size={20} className="text-lapis-muted group-hover:text-lapis-neon transition-colors" />
                <div>
                  <h3 className="text-base font-medium text-white">Data Retention Policy</h3>
                  <p className="text-sm text-lapis-muted mt-1">Configure how long telemetry logs are kept in TimescaleDB.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-lapis-muted bg-lapis-background px-2 py-1 rounded">30 Days</span>
                <ChevronRight size={16} className="text-lapis-muted" />
              </div>
            </div>

            <div className="p-4 md:p-6 flex items-center justify-between gap-4 group cursor-pointer hover:bg-lapis-card transition-colors">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-lapis-muted group-hover:text-lapis-neon transition-colors" />
                <div>
                  <h3 className="text-base font-medium text-white">Dashboard Auto-Refresh</h3>
                  <p className="text-sm text-lapis-muted mt-1">Adjust the update interval for KPI metrics (excluding real-time streams).</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-lapis-muted bg-lapis-background px-2 py-1 rounded">5 Min</span>
                <ChevronRight size={16} className="text-lapis-muted" />
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
