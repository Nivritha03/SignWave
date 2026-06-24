"use client";

import React, { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Grid2x2, List, Bell, Plus, Clock3, MoreHorizontal,
  ChevronRight, Play, BarChart3, AlertCircle,
  Captions, Hand, Mic,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

const SignAvatar = dynamic(() => import("@/components/SignAvatar"), { ssr: false });

/* ─── Types ───────────────────────────────────────────────────── */
type TabId = "overview" | "transcript" | "gloss" | "animation";
type ProjectStatus = "queued" | "extracting_audio" | "transcribing" | "processing_gloss" | "completed" | "failed";

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  duration: string;
  date: string;
  avatars: string[];
}

const STATUS_CFG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  "queued":           { label: "Queued", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
  "extracting_audio": { label: "Extract Audio", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "transcribing":     { label: "Transcribing", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "processing_gloss": { label: "Glossing", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "completed":        { label: "Completed",  color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  "failed":           { label: "Failed",     color: "#EF4444", bg: "rgba(239,68,68,0.12)"  },
};

/* ─── Gloss badge colour cycle ─────────────────────────────────── */
const BADGE_COLORS = [
  { bg: "rgba(123,92,245,0.2)", color: "#A78BFA", border: "rgba(123,92,245,0.4)" },
  { bg: "rgba(34,211,238,0.12)", color: "#22D3EE", border: "rgba(34,211,238,0.3)" },
  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E", border: "rgba(34,197,94,0.3)"  },
  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
];

/* ─── Sub-components ───────────────────────────────────────────── */
function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["queued"];
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44` }}
    >
      {status !== "completed" && status !== "failed" && <span className="w-1.5 h-1.5 rounded-full animate-blink-dot" style={{ background: cfg.color }} />}
      {status === "failed"      && <AlertCircle className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, status }: { value: number; status: ProjectStatus }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["queued"];
  const color = cfg.color;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: value === 100 ? "#22C55E" : `linear-gradient(90deg, ${color}, ${color}aa)` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

/* ─── AI Analysis Studio panel ─────────────────────────────────── */
function AIAnalysisStudio({ project }: { project: Project | null }) {
  const [tab, setTab] = useState<TabId>("transcript");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeGloss, setActiveGloss] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<"maya" | "alex">("alex");
  const [jobData, setJobData] = useState<any>(null);

  const TABS: { id: TabId; label: string }[] = [
    { id: "overview",   label: "Overview"       },
    { id: "transcript", label: "Transcript"     },
    { id: "gloss",      label: "Gloss"          },
    { id: "animation",  label: "Avatar Animation" }
  ];

  useEffect(() => {
    if (project) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${apiUrl}/job/${project.id}`)
        .then(res => res.json())
        .then(data => {
          setJobData(data);
          if (data.captions && data.captions.length > 0) {
            let captions;
            try {
              captions = typeof data.captions === "string" ? JSON.parse(data.captions) : data.captions;
            } catch (e) {
              captions = [];
            }
            if (captions[0] && captions[0].gloss) {
              setActiveGloss(captions[0].gloss);
            }
          }
        })
        .catch(console.error);
    }
  }, [project]);

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 text-sm">
        Select a project to open AI Analysis Studio
      </div>
    );
  }

  let captions: any[] = [];
  if (jobData && jobData.captions) {
    try {
      captions = typeof jobData.captions === "string" ? JSON.parse(jobData.captions) : jobData.captions;
    } catch(e) {}
  }

  return (
    <div className="h-full flex flex-col">
      {/* Studio header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <span className="text-white font-bold text-sm">AI Analysis Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/5 transition-colors border"
            style={{ borderColor: "var(--border)" }}
          >
            Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0.5 p-1 rounded-xl mb-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === t.id ? "rgba(123,92,245,0.25)" : "transparent",
              color: tab === t.id ? "#A78BFA" : "#6B7280",
              border: tab === t.id ? "1px solid rgba(123,92,245,0.3)" : "1px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto space-y-3">
        <AnimatePresence mode="wait">
          {tab === "transcript" && (
            <motion.div key="transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-xs font-bold">Transcript</span>
              </div>
              <div className="space-y-2">
                {captions.length > 0 ? captions.map((cap: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.06, 1) }}
                    className="flex gap-3 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent"
                    onClick={() => {
                      if (cap.gloss) {
                        setActiveGloss(cap.gloss);
                        setTab("gloss");
                      }
                    }}
                  >
                    <span className="text-[10px] font-mono text-purple-400 mt-0.5 flex-shrink-0">[{Math.floor(cap.start)}s]</span>
                    <span className="text-gray-300 text-xs leading-relaxed">{cap.text}</span>
                  </motion.div>
                )) : (
                  <div className="text-gray-500 text-xs">No transcript available yet.</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "gloss" && (
            <motion.div key="gloss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white text-xs font-bold">Sign Language Gloss</span>
              </div>
              <div className="space-y-2">
                {captions.length > 0 ? captions.map((cap: any, ri: number) => (
                  <div key={ri} className="flex flex-wrap gap-2 mb-2">
                    {(cap.gloss || []).map((word: string, wi: number) => {
                      const c = BADGE_COLORS[(ri + wi) % BADGE_COLORS.length];
                      return (
                        <motion.span
                          key={word + wi}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: Math.min((ri * 2 + wi) * 0.04, 1) }}
                          className="text-[11px] font-bold px-3 py-1 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                          style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
                          onClick={() => setActiveGloss([word])}
                        >
                          {word}
                        </motion.span>
                      );
                    })}
                  </div>
                )) : (
                  <div className="text-gray-500 text-xs">No glosses available yet.</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "animation" && (
            <motion.div key="animation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-bold">Sign Animation Preview</span>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>3D Avatar Output</span>
                </div>
              </div>

              {/* Avatar preview */}
              <div
                className="rounded-xl overflow-hidden relative"
                style={{ height: 200, background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.2), #0D1021 70%)" }}
              >
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading…</div>}>
                  <SignAvatar
                    modelUrl={`/models/${avatar === "maya" ? "Maya" : "Alex"}.glb`}
                    glossSequence={activeGloss}
                  />
                </Suspense>
              </div>

              {/* Playback controls */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
              >
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "rgba(123,92,245,0.5)" }}
                >
                  {isPlaying ? "⏸" : <Play className="w-3 h-3 ml-0.5" />}
                </button>
                <div className="flex-1 mx-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-full rounded-full w-1/4" style={{ background: "#7B5CF5" }} />
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <button className="text-gray-500 hover:text-white transition-colors text-[11px]">1x</button>
                </div>
              </div>

              {/* Bottom selectors */}
              <div
                className="grid grid-cols-2 gap-2 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
              >
                {[
                  { label: "Avatar",    options: ["Alex (Male)","Maya (Female)"], icon: <Hand className="w-3 h-3" />, isAvatar: true },
                  { label: "Captions",  options: ["On","Off"], icon: <Captions className="w-3 h-3" /> },
                ].map(({ label, options, icon, isAvatar }) => (
                  <div key={label}>
                    <div className="text-[9px] text-gray-600 mb-1 flex items-center gap-1">{icon}{label}</div>
                    <select
                      className="w-full bg-transparent text-gray-300 text-[10px] outline-none cursor-pointer"
                      onChange={(e) => {
                        if (isAvatar) {
                          setAvatar(e.target.value.includes("Maya") ? "maya" : "alex");
                          setActiveGloss([...activeGloss]);
                        }
                      }}
                    >
                      {options.map(o => <option key={o} value={o} style={{ background: "#111427" }}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div className="text-white font-semibold text-sm mb-1">{project.name}</div>
                <div className="text-gray-500 text-xs">{project.date} · {project.duration}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Progress",   value: `${project.progress}%`, color: "#22C55E" },
                  { label: "Status",     value: project.status, color: "#22D3EE" },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                    <div className="text-xl font-black" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Projects Page ────────────────────────────────────────────── */
export default function ProjectsPage() {
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState<"all" | ProjectStatus>("all");
  const [selected, setSelected]     = useState<Project | null>(null);
  const [viewMode, setViewMode]     = useState<"list" | "grid">("list");
  
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/jobs`)
      .then(res => res.json())
      .then((data: any[]) => {
        const mapped = data.map(j => ({
          id: j.id,
          name: `Project ${j.id.slice(0, 8)}`,
          status: j.status as ProjectStatus,
          progress: j.progress || 0,
          duration: "Unknown",
          date: j.date || new Date().toISOString().split("T")[0],
          avatars: ["N"]
        }));
        setProjects(mapped);
      })
      .catch(console.error);
  }, []);

  const FILTER_TABS = [
    { id: "all",         label: "All Projects" },
    { id: "completed",   label: "Completed"    },
    { id: "failed",      label: "Failed"        },
  ] as const;

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar />

      <div className="flex flex-1 ml-[220px] overflow-hidden">
        {/* ── Main projects list ──────────────────────────── */}
        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ borderRight: selected ? "1px solid var(--border)" : "none" }}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h1 className="text-white font-bold text-xl">Your Projects</h1>
                <p className="text-gray-500 text-xs mt-0.5">Manage and track all your sign language translation projects.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="relative p-2 rounded-xl border hover:bg-white/5 text-gray-400 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
                </button>
              </div>
            </div>

            {/* Search + Filter row */}
            <div className="flex items-center justify-between mt-4 gap-3">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
                {FILTER_TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id as typeof filter)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: filter === t.id ? "rgba(123,92,245,0.25)" : "transparent",
                      color: filter === t.id ? "#A78BFA" : "#6B7280",
                      border: filter === t.id ? "1px solid rgba(123,92,245,0.3)" : "1px solid transparent",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <Search className="w-3.5 h-3.5 text-gray-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent outline-none text-xs text-gray-300 placeholder-gray-600 w-40"
                    placeholder="Search projects..."
                  />
                </div>
                <button
                  onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                  className="p-2 rounded-xl border text-gray-500 hover:text-white transition-colors"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  {viewMode === "list" ? <Grid2x2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Project rows */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(i * 0.06, 1) }}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    background: selected?.id === p.id ? "rgba(123,92,245,0.1)" : "var(--card)",
                    border: selected?.id === p.id ? "1px solid rgba(123,92,245,0.4)" : "1px solid var(--border)",
                    boxShadow: selected?.id === p.id ? "0 0 20px rgba(123,92,245,0.1)" : "none",
                  }}
                >
                  {/* Avatar icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{
                      background: `${STATUS_CFG[p.status]?.color || "#9CA3AF"}22`,
                      border: `1px solid ${STATUS_CFG[p.status]?.color || "#9CA3AF"}44`,
                    }}
                  >
                    P
                  </div>

                  {/* Name + date */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{p.name}</div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-0.5">
                      <Clock3 className="w-2.5 h-2.5" />
                      {p.date}
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={p.status} />

                  {/* Progress bar */}
                  <ProgressBar value={p.progress} status={p.status} />

                  {/* Participant avatars */}
                  <div className="flex -space-x-2">
                    {p.avatars.map((av, ai) => (
                      <div
                        key={ai}
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                        style={{
                          background: `hsl(${(ai * 60 + 200) % 360}, 60%, 45%)`,
                          borderColor: "var(--card)",
                          zIndex: p.avatars.length - ai,
                        }}
                      >
                        {av}
                      </div>
                    ))}
                  </div>

                  {/* More button */}
                  <button
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                  <Search className="w-7 h-7 text-purple-400" />
                </div>
                <p className="text-white font-semibold mb-1">No projects found</p>
                <p className="text-gray-500 text-sm">Upload a video to get started or try a different filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: AI Analysis Studio ───────────────────── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 460, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex-shrink-0 p-5 overflow-hidden"
              style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}
            >
              <AIAnalysisStudio project={selected} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
