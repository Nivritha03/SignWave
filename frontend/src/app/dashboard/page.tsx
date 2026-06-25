"use client";

import React, { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Bell, Zap, Clock3, RefreshCw, CheckCircle2,
  Mic, Hand, Languages, Video,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";

const SignAvatar = dynamic(() => import("@/components/SignAvatar"), { ssr: false });
const ProcessingStudio = dynamic(() => import("@/components/ProcessingStudio"), { ssr: false });

// ---------------------------------------------------------------------------
// Pipeline steps shown in the right column (static reference)
// ---------------------------------------------------------------------------
const PIPELINE_STEPS = [
  { icon: <Video className="w-3.5 h-3.5" />,     label: "Video / Audio Input",   color: "#9CA3AF" },
  { icon: <Mic className="w-3.5 h-3.5" />,       label: "Whisper Transcription", color: "#3B82F6" },
  { icon: <Languages className="w-3.5 h-3.5" />, label: "Gemini ASL Glossing",   color: "#8B5CF6" },
  { icon: <Hand className="w-3.5 h-3.5" />,      label: "Avatar Signing",        color: "#22C55E" },
];

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
  const [selectedAvatar, setSelectedAvatar] = useState<"maya" | "alex">("alex");
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [studioJobId, setStudioJobId] = useState<string | undefined>();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchRecentProjects = () => {
    fetch(`${apiUrl}/jobs`)
      .then((res) => res.json())
      .then((data) => setRecentProjects(data.slice(-4).reverse()))
      .catch(console.error);
  };

  useEffect(() => {
    fetchRecentProjects();
    const interval = setInterval(fetchRecentProjects, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadProjectIntoStudio = (proj: any) => {
    setStudioJobId(proj.id);
    // Scroll to top so the user sees ProcessingStudio update
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar />

      <div className="flex flex-1 ml-[220px] overflow-hidden">

        {/* ── Center column ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-2xl">Welcome back, Nivritha! 👋</h1>
              <p className="text-gray-500 text-sm mt-0.5">Create, translate &amp; make content accessible for everyone.</p>
            </div>
            <button
              className="relative p-2.5 rounded-xl transition-colors hover:bg-white/5"
              style={{ border: "1px solid var(--border)" }}
            >
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
            </button>
          </div>

          {/* ── Hero card ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #13103A 0%, #0E1829 50%, #0D1021 100%)",
              border: "1px solid rgba(123,92,245,0.25)",
              minHeight: 180,
            }}
          >
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex items-center h-full px-8 py-6 gap-8">
              <div className="flex-1 z-10">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                  style={{ background: "rgba(123,92,245,0.2)", color: "#A78BFA", border: "1px solid rgba(123,92,245,0.3)" }}
                >
                  <Zap className="w-3 h-3" />
                  AI-Powered Sign Language Translation
                </div>
                <h2 className="text-white text-2xl font-black leading-tight mb-2">Translate Instantly</h2>
                <p className="text-gray-400 text-xs mb-4 max-w-sm leading-relaxed">
                  Transform any video, audio, or online link into accurate captions and realistic sign language animations in seconds.
                </p>
              </div>

              {/* Mini Avatar inside Hero */}
              <div
                className="w-40 h-40 flex-shrink-0 relative rounded-2xl overflow-hidden"
                style={{ background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.3), transparent 70%)" }}
              >
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading…</div>}>
                  <SignAvatar modelUrl="/models/Maya.glb" glossSequence={["HELLO", "WELCOME"]} />
                </Suspense>
              </div>
            </div>
          </motion.div>

          {/* ── ProcessingStudio ──────────────────────────────────── */}
          <ProcessingStudio
            key={studioJobId}
            initialJobId={studioJobId}
            selectedAvatar={selectedAvatar}
            onAvatarChange={setSelectedAvatar}
          />

          {/* ── Recent Projects ───────────────────────────────────── */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-sm">Recent Projects</h3>
                <p className="text-gray-500 text-xs mt-0.5">Click any project to load it into the Studio.</p>
              </div>
              <a href="/projects" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">View all →</a>
            </div>

            <div className="space-y-2">
              {recentProjects.map((p, i) => {
                const color = p.status === "completed" ? "#22C55E" : p.status === "failed" ? "#EF4444" : "#7B5CF5";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => loadProjectIntoStudio(p)}
                    className="flex items-center gap-4 py-3 border-b last:border-b-0 rounded-lg px-2 cursor-pointer hover:bg-white/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `${color}22`, border: `1px solid ${color}44` }}
                    >
                      {p.id.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-semibold truncate">Project {p.id.slice(0, 8)}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                        <Clock3 className="w-2.5 h-2.5" />
                        {p.date || "Just now"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${p.progress}%`, background: color }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 text-right">{p.progress}%</div>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
                        style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                      >
                        {p.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {recentProjects.length === 0 && (
                <div className="text-gray-500 text-xs py-4 text-center">No projects yet. Upload a file above!</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: Pipeline Reference ─────────────────────── */}
        <div
          className="w-[300px] flex-shrink-0 p-6 overflow-y-auto"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <RefreshCw className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI Pipeline</h2>
              <div className="text-[10px] text-gray-500">Processing flow</div>
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-3 relative">
            {/* Connector line */}
            <div
              className="absolute left-[11px] top-7 bottom-7 w-0.5"
              style={{ background: "linear-gradient(to bottom, rgba(123,92,245,0.4), rgba(34,197,94,0.4))" }}
            />
            {PIPELINE_STEPS.map((step, i) => (
              <div key={i} className="relative flex items-center gap-3 pl-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{ background: `${step.color}22`, border: `1px solid ${step.color}55`, color: step.color }}
                >
                  {step.icon}
                </div>
                <div
                  className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", color: step.color }}
                >
                  {step.label}
                </div>
              </div>
            ))}
          </div>

          {/* Info card */}
          <div
            className="mt-6 p-4 rounded-xl text-[11px] leading-relaxed text-gray-400 space-y-2"
            style={{ background: "rgba(123,92,245,0.05)", border: "1px solid rgba(123,92,245,0.15)" }}
          >
            <div className="text-purple-300 font-bold text-xs mb-1">How it works</div>
            <p>1. Upload a video or paste a URL.</p>
            <p>2. Whisper transcribes the audio with timestamps.</p>
            <p>3. Gemini translates each sentence to ASL gloss.</p>
            <p>4. Alex or Maya signs the gloss sequence in real-time 3D.</p>
          </div>

          {/* API status card */}
          <div
            className="mt-4 p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
          >
            <h3 className="text-white text-xs font-bold mb-3 border-b border-white/10 pb-2">API Endpoints</h3>
            <div className="space-y-1.5 text-[10px]">
              {[
                { method: "POST", path: "/api/upload/video" },
                { method: "POST", path: "/api/upload/link" },
                { method: "GET",  path: "/job/{id}" },
                { method: "GET",  path: "/animation/{id}" },
                { method: "GET",  path: "/export/{id}" },
                { method: "POST", path: "/generate-motion" },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2">
                  <span
                    className="font-black px-1.5 py-0.5 rounded text-[9px]"
                    style={{
                      background: ep.method === "POST" ? "rgba(139,92,246,0.2)" : "rgba(34,211,238,0.15)",
                      color: ep.method === "POST" ? "#A78BFA" : "#22D3EE",
                    }}
                  >
                    {ep.method}
                  </span>
                  <span className="text-gray-500 font-mono">{ep.path}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
