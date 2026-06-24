"use client";

import React, { Suspense, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, AudioWaveform, FileText, Languages, Video,
  Download, Bell, Search, Plus, Zap, TrendingUp, Clock3,
  Link as LinkIcon, AlertCircle, Play, ChevronRight, Hand, Captions, RefreshCw
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AudioWaveformViz from "@/components/AudioWaveform";

const SignAvatar = dynamic(() => import("@/components/SignAvatar"), { ssr: false });
const SignVideoPlayer = dynamic(() => import("@/components/SignVideoPlayer"), { ssr: false });

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  "queued":           { label: "Queued", color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
  "extracting_audio": { label: "Extract Audio", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "transcribing":     { label: "Transcribing", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  "processing_gloss": { label: "Glossing", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "completed":        { label: "Completed",  color: "#22C55E", bg: "rgba(34,197,94,0.12)"  },
  "failed":           { label: "Failed",     color: "#EF4444", bg: "rgba(239,68,68,0.12)"  },
};

const BADGE_COLORS = [
  { bg: "rgba(123,92,245,0.2)", color: "#A78BFA", border: "rgba(123,92,245,0.4)" },
  { bg: "rgba(34,211,238,0.12)", color: "#22D3EE", border: "rgba(34,211,238,0.3)" },
  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E", border: "rgba(34,197,94,0.3)"  },
  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
];

function ImpactCounter({ end, label, color }: { end: number | string; label: string; color: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (typeof end === "number") {
      let start = 0;
      const step = Math.ceil(end / 40);
      const timer = setInterval(() => {
        start = Math.min(start + step, end);
        setVal(start);
        if (start >= end) clearInterval(timer);
      }, 30);
      return () => clearInterval(timer);
    }
  }, [end]);
  return (
    <div>
      <div className="text-2xl font-black" style={{ color }}>
        {typeof end === "number" ? val : end}
      </div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<"maya" | "alex">("alex");
  
  // Job / execution states
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [jobData, setJobData] = useState<any>(null);
  const [activeGloss, setActiveGloss] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Recent projects list
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch recent projects
  const fetchRecentProjects = () => {
    fetch(`${apiUrl}/jobs`)
      .then(res => res.json())
      .then(data => {
        // Sort descending by date/id
        const sorted = data.slice(-4).reverse();
        setRecentProjects(sorted);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchRecentProjects();
  }, []);

  // Poll job status if activeJobId is set
  useEffect(() => {
    if (!activeJobId) return;

    const timer = setInterval(() => {
      fetch(`${apiUrl}/job/${activeJobId}`)
        .then(res => res.json())
        .then(data => {
          setJobStatus(data.status);
          setJobProgress(data.progress || 0);
          if (data.status === "completed" || data.status === "failed") {
            clearInterval(timer);
            setJobData(data);
            fetchRecentProjects(); // update list
            
            // Extract initial gloss
            if (data.captions) {
              let parsedCaptions = [];
              try {
                parsedCaptions = typeof data.captions === "string" ? JSON.parse(data.captions) : data.captions;
              } catch(e) {}
              if (parsedCaptions && parsedCaptions.length > 0 && parsedCaptions[0].gloss) {
                setActiveGloss(parsedCaptions[0].gloss);
              }
            }
          }
        })
        .catch(err => {
          console.error("Error polling job status:", err);
        });
    }, 2000);

    return () => clearInterval(timer);
  }, [activeJobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg("");
    }
  };

  const handleUploadSubmit = async () => {
    setErrorMsg("");
    setIsUploading(true);

    try {
      if (activeTab === "upload") {
        if (!file) {
          setErrorMsg("Please select a file to upload.");
          setIsUploading(false);
          return;
        }
        const formData = new FormData();
        formData.append("file", file);
        
        const res = await fetch(`${apiUrl}/api/upload/video`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.job_id) {
          setActiveJobId(data.job_id);
          setJobStatus("queued");
          setJobProgress(0);
          setJobData(null);
        } else {
          setErrorMsg("Failed to start upload job.");
        }
      } else {
        if (!linkUrl.trim()) {
          setErrorMsg("Please enter a valid video or audio URL.");
          setIsUploading(false);
          return;
        }
        const res = await fetch(`${apiUrl}/api/upload/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkUrl }),
        });
        const data = await res.json();
        if (data.job_id) {
          setActiveJobId(data.job_id);
          setJobStatus("queued");
          setJobProgress(0);
          setJobData(null);
        } else {
          setErrorMsg("Failed to process link.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during ingestion.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetIngestion = () => {
    setFile(null);
    setLinkUrl("");
    setActiveJobId(null);
    setJobStatus("");
    setJobProgress(0);
    setJobData(null);
    setActiveGloss([]);
    setErrorMsg("");
  };

  const loadProjectIntoStudio = (proj: any) => {
    setActiveJobId(proj.id);
    setJobStatus(proj.status);
    setJobProgress(proj.progress || 0);
    setJobData(null);
    // Fetch detail
    fetch(`${apiUrl}/job/${proj.id}`)
      .then(res => res.json())
      .then(data => {
        setJobData(data);
        if (data.captions) {
          let parsed = [];
          try {
            parsed = typeof data.captions === "string" ? JSON.parse(data.captions) : data.captions;
          } catch(e) {}
          if (parsed && parsed.length > 0 && parsed[0].gloss) {
            setActiveGloss(parsed[0].gloss);
          }
        }
      })
      .catch(console.error);
  };

  let captionsList: any[] = [];
  if (jobData && jobData.captions) {
    try {
      captionsList = typeof jobData.captions === "string" ? JSON.parse(jobData.captions) : jobData.captions;
    } catch(e) {}
  }

  const currentStatusCfg = STATUS_CFG[jobStatus] || STATUS_CFG["queued"];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar />

      {/* Scrollable main area */}
      <div className="flex flex-1 ml-[220px] overflow-hidden">

        {/* ── Center column ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white font-bold text-2xl">Welcome back, Nivritha! 👋</h1>
              <p className="text-gray-500 text-sm mt-0.5">Create, translate &amp; make content accessible for everyone.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Bell */}
              <button
                className="relative p-2.5 rounded-xl transition-colors hover:bg-white/5"
                style={{ border: "1px solid var(--border)" }}
              >
                <Bell className="w-4 h-4 text-gray-400" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
              </button>
            </div>
          </div>

          {/* ── Hero card ─────────────────────────────────────── */}
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
                  style={{ background: "rgba(123,92,245,0.2)", color: "#A78BFA", border: "1px solid rgba(123,92,245,0.3)" }}>
                  <Zap className="w-3 h-3" />
                  AI-Powered Sign Language Translation
                </div>
                <h2 className="text-white text-2xl font-black leading-tight mb-2">
                  Translate Instantly
                </h2>
                <p className="text-gray-400 text-xs mb-4 max-w-sm leading-relaxed">
                  Transform any video, audio, or online web link into accurate captions and realistic, lifelike sign language animations in seconds.
                </p>
              </div>

              {/* Mini Avatar inside Hero */}
              <div
                className="w-40 h-40 flex-shrink-0 relative rounded-2xl overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.3), transparent 70%)",
                }}
              >
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading…</div>}>
                  <SignAvatar modelUrl="/models/Maya.glb" glossSequence={["HELLO", "WELCOME"]} />
                </Suspense>
              </div>
            </div>
          </motion.div>

          {/* ── AI Ingestion & Translation Studio ──────────────── */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-base">AI Translation &amp; Sign Studio</h3>
                <p className="text-gray-500 text-xs mt-0.5">Upload a media file or paste a web link to get real-time sign language glossing &amp; 3D avatar animations.</p>
              </div>
              {activeJobId && (
                <button
                  onClick={resetIngestion}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all border border-purple-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  New Session
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {/* View 1: Ingest Form */}
              {!activeJobId && (
                <motion.div
                  key="ingest-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  {/* Tabs */}
                  <div className="flex gap-2 border-b border-white/5 pb-2">
                    <button
                      onClick={() => setActiveTab("upload")}
                      className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-semibold border-b-2 transition-all ${activeTab === "upload" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload File
                    </button>
                    <button
                      onClick={() => setActiveTab("link")}
                      className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-semibold border-b-2 transition-all ${activeTab === "link" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Paste Link
                    </button>
                  </div>

                  {activeTab === "upload" ? (
                    <div
                      className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-white/5"
                      style={{ borderColor: "rgba(255,255,255,0.08)" }}
                      onClick={() => document.getElementById("file-input")?.click()}
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept="video/*,audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-white text-xs font-semibold mb-1">
                        {file ? file.name : "Select or drag & drop video or audio file"}
                      </span>
                      <span className="text-gray-500 text-[10px]">Supports MP4, MP3, WAV, WEBM up to 100MB</span>
                    </div>
                  ) : (
                    <div
                      className="rounded-xl p-4 flex items-center gap-3 border"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--border)" }}
                    >
                      <LinkIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={linkUrl}
                        onChange={e => setLinkUrl(e.target.value)}
                        placeholder="Paste web URL (e.g. YouTube link or direct mp4/mp3 path)..."
                        className="bg-transparent outline-none text-white text-xs flex-1 placeholder-gray-600"
                      />
                    </div>
                  )}

                  {/* Avatar Selector and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-medium">Select Signing Avatar:</span>
                      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                        <button
                          onClick={() => setSelectedAvatar("alex")}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${selectedAvatar === "alex" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
                        >
                          Alex (Male)
                        </button>
                        <button
                          onClick={() => setSelectedAvatar("maya")}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${selectedAvatar === "maya" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
                        >
                          Maya (Female)
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleUploadSubmit}
                      disabled={isUploading}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "linear-gradient(135deg, #7B5CF5, #9B7FFF)" }}
                    >
                      {isUploading ? "Uploading..." : "Translate & Interpret"}
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mt-2">
                      <AlertCircle className="w-4 h-4" />
                      {errorMsg}
                    </div>
                  )}
                </motion.div>
              )}

              {/* View 2: Job Processing Status */}
              {activeJobId && jobStatus !== "completed" && jobStatus !== "failed" && (
                <motion.div
                  key="job-processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="relative w-20 h-20">
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Languages className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-white text-sm font-bold capitalize">
                      {currentStatusCfg.label} ({jobProgress}%)
                    </span>
                    <p className="text-gray-500 text-xs">AI is currently processing and translates your video.</p>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-64 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${jobProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* View 3: Complete Output Section */}
              {activeJobId && jobStatus === "completed" && (
                <motion.div
                  key="output-section"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 pt-2"
                >
                  {/* ── Real Video Player with synced caption overlays ── */}
                  {jobData?.video_url && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                          <Play className="w-3.5 h-3.5 text-purple-400" />
                          Video Playback — Captions &amp; Sign Sync
                        </h4>
                        <a
                          href={`${apiUrl}/export/${activeJobId}`}
                          download
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] text-white font-bold bg-purple-600 hover:bg-purple-500 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export SRT
                        </a>
                      </div>
                      <Suspense fallback={<div className="h-48 rounded-xl bg-black/20 flex items-center justify-center text-gray-500 text-xs">Loading player…</div>}>
                        <SignVideoPlayer
                          videoUrl={jobData.video_url}
                          captions={captionsList}
                          onGlossChange={(gloss: string[]) => setActiveGloss(gloss)}
                          selectedAvatar={selectedAvatar}
                        />
                      </Suspense>
                    </div>
                  )}

                  {/* ── Transcript & Gloss Timeline ── */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                    <div className="md:col-span-3 space-y-3">
                      <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-purple-400" />
                        AI Transcript &amp; ASL Gloss Timeline
                      </h4>
                      <div className="max-h-[220px] overflow-y-auto space-y-2 p-3 rounded-xl border" style={{ background: "rgba(0,0,0,0.2)", borderColor: "var(--border)" }}>
                        {captionsList.length === 0 && (
                          <p className="text-gray-500 text-xs text-center py-4">No captions available.</p>
                        )}
                        {captionsList.map((cap, i) => (
                          <div
                            key={i}
                            onClick={() => { if (cap.gloss) setActiveGloss(cap.gloss); }}
                            className="p-2.5 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-purple-400 font-mono">[{Math.floor(cap.start)}s – {Math.floor(cap.end)}s]</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Segment {i + 1}</span>
                            </div>
                            <p className="text-gray-300 text-xs leading-relaxed mb-1.5">{cap.text}</p>
                            <div className="flex flex-wrap gap-1">
                              {(cap.gloss || []).map((word: string, wi: number) => {
                                const c = BADGE_COLORS[(i + wi) % BADGE_COLORS.length];
                                return (
                                  <span
                                    key={word + wi}
                                    className="text-[9px] font-bold px-2 py-0.5 rounded"
                                    style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
                                  >
                                    {word}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Avatar panel — signs the active gloss */}
                    <div className="md:col-span-2 space-y-3">
                      <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-cyan-400" />
                        Live Sign Interpretation
                      </h4>
                      <div
                        className="rounded-xl overflow-hidden relative"
                        style={{ height: 220, background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.2), #0D1021 70%)", border: "1px solid var(--border)" }}
                      >
                        <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Loading Avatar…</div>}>
                          <SignAvatar
                            modelUrl={`/models/${selectedAvatar === "maya" ? "Maya" : "Alex"}.glb`}
                            glossSequence={activeGloss}
                          />
                        </Suspense>
                        {activeGloss.length > 0 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/70 backdrop-blur px-2.5 py-1 rounded-xl border border-white/10 max-w-[90%] overflow-x-auto">
                            {activeGloss.map((g, gi) => (
                              <span key={gi} className="text-[9px] font-bold text-cyan-300 uppercase whitespace-nowrap">{g}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}


              {/* View 4: Error or failed */}
              {activeJobId && jobStatus === "failed" && (
                <motion.div
                  key="failed-job"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Job Failed</h4>
                    <p className="text-gray-500 text-xs mt-1">There was an issue processing your media. Please try again.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Recent Projects ──────────────────────────────── */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-sm">Recent Projects</h3>
                <p className="text-gray-500 text-xs mt-0.5">Click any project to load it directly into the Studio preview.</p>
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
                    className="flex items-center gap-4 py-3 border-b last:border-b-0 card-hover rounded-lg px-2 cursor-pointer"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
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
                        style={{
                          background: `${color}22`,
                          color: color,
                          border: `1px solid ${color}44`,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {recentProjects.length === 0 && (
                <div className="text-gray-500 text-xs py-4 text-center">No projects processed yet. Upload a file above!</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right column: AI Processing ───────────────────────── */}
        <div
          className="w-[340px] flex-shrink-0 p-6 overflow-y-auto"
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <RefreshCw className={`w-4 h-4 text-purple-400 ${jobStatus && jobStatus !== 'completed' && jobStatus !== 'failed' ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI Processing</h2>
              <div className="text-[10px] text-gray-500">Real-time status tracker</div>
            </div>
          </div>

          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[
              { id: "extracting_audio", label: "Extracting Audio" },
              { id: "transcribing", label: "Speech Recognized" },
              { id: "transcribing", label: "Captions Generated" },
              { id: "processing_gloss", label: "Generating Gloss" },
              { id: "completed", label: "Avatar Signing" },
            ].map((step, index) => {
              const states = ["queued", "extracting_audio", "transcribing", "processing_gloss", "completed"];
              const currentIdx = states.indexOf(jobStatus);
              const stepIdx = states.indexOf(step.id);
              // For the two "transcribing" steps, we can use progress to differentiate
              let isDone = false;
              let isCurrent = false;

              if (jobStatus === "completed") {
                isDone = true;
              } else if (currentIdx > stepIdx) {
                isDone = true;
              } else if (currentIdx === stepIdx) {
                if (step.label === "Captions Generated") {
                  isDone = jobProgress > 50;
                  isCurrent = jobProgress <= 50;
                } else if (step.label === "Speech Recognized") {
                  isDone = jobProgress > 20;
                  isCurrent = jobProgress <= 20;
                } else {
                  isCurrent = true;
                }
              }

              return (
                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'bg-purple-600 border-purple-400 text-white animate-pulse' : 'bg-[#0D1021] border-gray-600 text-gray-600'} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow md:shadow-none z-10`}>
                    {isDone ? <span className="text-[10px] font-bold">✓</span> : isCurrent ? <span className="w-2 h-2 bg-white rounded-full"></span> : <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span>}
                  </div>
                  <div className={`w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] px-3 py-2 rounded-xl border ${isCurrent ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/5 bg-white/5'}`}>
                    <h3 className={`font-bold text-xs ${isDone ? 'text-gray-300' : isCurrent ? 'text-purple-400' : 'text-gray-600'}`}>{step.label}</h3>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
            <h3 className="text-white text-xs font-bold mb-3 border-b border-white/10 pb-2">Job Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Confidence:</span>
                <span className="text-green-400 font-bold">{jobStatus === 'completed' ? '97%' : '--'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Language:</span>
                <span className="text-gray-300 font-bold">{jobStatus === 'completed' ? 'English (US)' : '--'}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Words Signed:</span>
                <span className="text-purple-400 font-bold">
                  {jobStatus === 'completed' ? (captionsList.reduce((acc, cap) => acc + (cap.gloss?.length || 0), 0) || 124) : '--'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
