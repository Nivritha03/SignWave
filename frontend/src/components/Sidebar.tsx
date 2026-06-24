"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Mic2,
  BookOpen,
  Settings,
  Zap,
  Activity,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",     icon: LayoutDashboard, href: "/dashboard" },
  { label: "Projects",      icon: FolderOpen,      href: "/projects"  },
  { label: "Live Studio",   icon: Mic2,            href: "/live"      },
  { label: "Settings",      icon: Settings,        href: "/settings"  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-40"
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7B5CF5, #22D3EE)" }}
        >
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">SignWave</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, href }) => {
          const isActive = pathname
            ? href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href)
            : false;
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item${isActive ? " active" : ""}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="px-3 pb-3">
        <div
          className="rounded-xl p-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(123,92,245,0.2), rgba(34,211,238,0.1))", border: "1px solid rgba(123,92,245,0.3)" }}
        >
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-purple-500/10 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-xs font-bold">Upgrade to Pro</span>
            </div>
            <p className="text-gray-400 text-[11px] mb-3 leading-relaxed">
              Unlock advanced AI models, custom avatars & more.
            </p>
            <button
              className="w-full py-2 rounded-lg text-white text-xs font-bold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7B5CF5, #22D3EE)" }}
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>

      {/* User */}
      <div
        className="px-3 pb-4 pt-3 flex items-center gap-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #7B5CF5, #9B7FFF)" }}
        >
          N
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold truncate">Nivritha Dev</div>
          <div className="text-gray-500 text-[11px]">Pro Plan</div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
