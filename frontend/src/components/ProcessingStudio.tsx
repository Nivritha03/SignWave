"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Link as LinkIcon, Play, Download, RefreshCw,
  FileText, Hand, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, Volume2, Clock, Zap,
} from "lucide-react";

const SignAvatar = dynamic(() => import("./SignAvatar"), { ssr: false });

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATUS_STEPS = [
  { id: "queued",            label: "Queued",           icon: "⏳" },
  { id: "extracting_audio",  label: "Extracting Audio", icon: "🎵" },
  { id: "transcribing",      label: "Transcribing",     icon: "🎤" },
  { id: "processing_gloss",  label: "Glossing",         icon: "🤟" },
  { id: "completed",         label: "Complete",         icon: "✅" },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.id);

const BADGE_COLORS = [
  { bg: "rgba(123,92,245,0.2)", color: "#A78BFA", border: "rgba(123,92,245,0.4)" },
  { bg: "rgba(34,211,238,0.12)", color: "#22D3EE", border: "rgba(34,211,238,0.3)" },
  { bg: "rgba(34,197,94,0.12)",  color: "#22C55E", border: "rgba(34,197,94,0.3)"  },
  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "rgba(245,158,11,0.3)" },
];

function fmtSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PipelineProgress({ status, progress }: { status: string; progress: number }) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const failed = status === "failed";

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: failed ? "#EF4444" : "linear-gradient(90deg, #7B5CF5, #22D3EE)" }}
          initial={{ width: 0 }}
          animate={{ width: failed ? "100%" : `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between">
        {STATUS_STEPS.filter((s) => s.id !== "queued").map((step, i) => {
          const stepIdx = STATUS_ORDER.indexOf(step.id);
          const done = !failed && currentIdx >= stepIdx;
          const active = !failed && currentIdx === stepIdx;
          return (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-500 ${
                  done ? "bg-purple-500 text-white shadow-[0_0_12px_rgba(123,92,245,0.6)]" :
                  active ? "bg-purple-900 border border-purple-500 text-purple-300 animate-pulse" :
                  "bg-white/5 border border-white/10 text-gray-600"
                }`}
              >
                {done && !active ? "✓" : step.icon}
              </div>
              <span className={`text-[9px] font-semibold ${done ? "text-purple-300" : "text-gray-600"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GlossToken({ word, index }: { word: string; index: number }) {
  const c = BADGE_COLORS[index % BADGE_COLORS.length];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300 }}
      className="text-[11px] font-black px-2.5 py-1 rounded-lg tracking-widest cursor-default select-none"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {word}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Main ProcessingStudio
// ---------------------------------------------------------------------------

interface ProcessingStudioProps {
  /** If provided, immediately load this jobId (e.g. from a recent projects click) */
  initialJobId?: string;
  /** Controlled avatar selection */
  selectedAvatar?: "alex" | "maya";
  onAvatarChange?: (a: "alex" | "maya") => void;
}

export default function ProcessingStudio({
  initialJobId,
  selectedAvatar = "alex",
  onAvatarChange,
}: ProcessingStudioProps) {
  // Ingestion state
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Job state
  const [jobId, setJobId] = useState<string | null>(initialJobId || null);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobProgress, setJobProgress] = useState(0);
  const [jobData, setJobData] = useState<any>(null);

  // UI — active gloss for avatar
  const [activeGloss, setActiveGloss] = useState<string[]>([]);
  const [activeSegIdx, setActiveSegIdx] = useState<number | null>(null);

  // Drag-over
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const captions: any[] = (() => {
    if (!jobData?.captions) return [];
    try { return typeof jobData.captions === "string" ? JSON.parse(jobData.captions) : jobData.captions; }
    catch { return []; }
  })();

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    let mounted = true;

    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/job/${jobId}`);
        const data = await res.json();
        if (!mounted) return;
        setJobStatus(data.status);
        setJobProgress(data.progress || 0);
        if (data.status === "completed" || data.status === "failed") {
          setJobData(data);
          // Set initial gloss from first caption
          if (data.captions) {
            try {
              const caps = typeof data.captions === "string" ? JSON.parse(data.captions) : data.captions;
              if (caps?.[0]?.gloss?.length) {
                setActiveGloss(caps[0].gloss);
                setActiveSegIdx(0);
              }
            } catch { /* noop */ }
          }
        }
      } catch { /* network error — keep polling */ }
    };

    poll(); // immediate first call
    const id = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, [jobId]);

  // ── Load initial job if provided ──────────────────────────────────────────
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
      setJobStatus("queued");
    }
  }, [initialJobId]);

  // ── Upload handlers ───────────────────────────────────────────────────────
  const handleFileSelect = (f: File) => {
    setFile(f);
    setErrorMsg("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setIsUploading(true);
    try {
      let res: Response;
      if (tab === "upload") {
        if (!file) { setErrorMsg("Please select a file."); return; }
        const fd = new FormData();
        fd.append("file", file);
        res = await fetch(`${API_URL}/api/upload/video`, { method: "POST", body: fd });
      } else {
        if (!linkUrl.trim()) { setErrorMsg("Please enter a URL."); return; }
        res = await fetch(`${API_URL}/api/upload/link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkUrl }),
        });
      }
      const data = await res.json();
      if (data.job_id) {
        setJobId(data.job_id);
        setJobStatus("queued");
        setJobProgress(0);
        setJobData(null);
        setActiveGloss([]);
        setActiveSegIdx(null);
      } else {
        setErrorMsg(data.detail || "Failed to start job.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Network error.");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setJobId(null); setJobStatus(""); setJobProgress(0); setJobData(null);
    setFile(null); setLinkUrl(""); setActiveGloss([]); setActiveSegIdx(null); setErrorMsg("");
  };

  const isProcessing = jobId && jobStatus && jobStatus !== "completed" && jobStatus !== "failed";
  const isCompleted = jobId && jobStatus === "completed";
  const isFailed = jobId && jobStatus === "failed";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full h-full">

      {/* ── INGESTION FORM ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!jobId && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                AI Sign Language Studio
              </h3>
              <p className="text-gray-500 text-xs mt-1">
                Upload a video or paste a link. Whisper will transcribe, Gemini will gloss, and Alex or Maya will sign it.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-3 mb-4">
              {[
                { id: "upload" as const, label: "Upload File", icon: <Upload className="w-3.5 h-3.5" /> },
                { id: "link" as const, label: "Paste Link", icon: <LinkIcon className="w-3.5 h-3.5" /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 pb-2 px-2 text-xs font-semibold border-b-2 transition-all ${
                    tab === t.id ? "border-purple-500 text-purple-400" : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            {tab === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                style={{
                  borderColor: dragOver ? "rgba(123,92,245,0.7)" : file ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.08)",
                  background: dragOver ? "rgba(123,92,245,0.07)" : "transparent",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  {file ? <CheckCircle2 className="w-7 h-7 text-green-400" /> : <Upload className="w-7 h-7 text-purple-400" />}
                </div>
                <span className="text-white text-sm font-semibold mb-1">
                  {file ? file.name : "Drop your video or audio file here"}
                </span>
                <span className="text-gray-500 text-xs">MP4, MKV, MOV, WEBM, MP3, WAV · up to 500MB</span>
              </div>
            ) : (
              <div className="rounded-xl p-4 flex items-center gap-3 border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--border)" }}>
                <LinkIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Paste YouTube, Vimeo, or direct media URL…"
                  className="bg-transparent outline-none text-white text-xs flex-1 placeholder-gray-600"
                />
              </div>
            )}

            {/* Avatar selector + Submit */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Signing Avatar:</span>
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                  {(["alex", "maya"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => onAvatarChange?.(a)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                        selectedAvatar === a
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                          : "text-gray-500 hover:text-gray-300 border border-transparent"
                      }`}
                    >
                      {a === "alex" ? "Alex (Male)" : "Maya (Female)"}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7B5CF5, #9B7FFF)" }}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isUploading ? "Uploading…" : "Translate & Sign"}
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mt-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PROCESSING SCREEN ─────────────────────────────────────────────── */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-bold text-base">Processing Pipeline</h3>
                <p className="text-gray-500 text-xs mt-0.5">Your media is being processed through the AI pipeline.</p>
              </div>
              <button onClick={reset} className="text-gray-600 hover:text-gray-400 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Animated spinner */}
            <div className="flex justify-center mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-purple-500/30 border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Hand className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-white font-bold text-lg capitalize">
                {STATUS_STEPS.find((s) => s.id === jobStatus)?.label ?? jobStatus} — {jobProgress}%
              </p>
              <p className="text-gray-500 text-xs mt-1">Job ID: {jobId?.slice(0, 8)}…</p>
            </div>

            <PipelineProgress status={jobStatus} progress={jobProgress} />
          </motion.div>
        )}

        {/* ── FAILED ─────────────────────────────────────────────────────────── */}
        {isFailed && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--card)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h4 className="text-white font-bold mb-1">Processing Failed</h4>
            <p className="text-gray-500 text-xs mb-4">There was an error processing your media. Check the server logs for details.</p>
            <button
              onClick={reset}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* ── OUTPUT ─────────────────────────────────────────────────────────── */}
        {isCompleted && (
          <motion.div
            key="output"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Header with stats + new session */}
            <div
              className="rounded-2xl p-4 flex flex-wrap items-center gap-4"
              style={{ background: "var(--card)", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">Processing Complete</div>
                <div className="flex flex-wrap gap-3 mt-1">
                  {jobData?.confidence && (
                    <span className="text-[10px] text-gray-500">Confidence: <span className="text-green-400 font-bold">{jobData.confidence}</span></span>
                  )}
                  {jobData?.language && (
                    <span className="text-[10px] text-gray-500">Language: <span className="text-cyan-400 font-bold">{jobData.language}</span></span>
                  )}
                  {jobData?.duration && (
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtSec(jobData.duration)}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">
                    Words Signed: <span className="text-purple-400 font-bold">
                      {captions.reduce((acc: number, cap: any) => acc + (cap.gloss?.length || 0), 0)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`${API_URL}/export/${jobId}`}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export SRT
                </a>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-purple-400 hover:text-purple-300 transition-all border border-purple-500/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> New
                </button>
              </div>
            </div>

            {/* Main content: Transcript + Avatar */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Transcript & Gloss Timeline — left 3 cols */}
              <div className="lg:col-span-3 rounded-2xl p-4 space-y-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h4 className="text-white font-bold text-xs flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  Transcript &amp; ASL Gloss Timeline
                  <span className="ml-auto text-[10px] text-gray-600 font-normal">Click a segment to sign it</span>
                </h4>

                <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {captions.length === 0 && (
                    <p className="text-gray-600 text-xs text-center py-6">No captions generated.</p>
                  )}
                  {captions.map((cap: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.8) }}
                      onClick={() => {
                        if (cap.gloss?.length) {
                          setActiveGloss(cap.gloss);
                          setActiveSegIdx(i);
                        }
                      }}
                      className="p-3 rounded-xl cursor-pointer transition-all group"
                      style={{
                        background: activeSegIdx === i ? "rgba(123,92,245,0.12)" : "rgba(255,255,255,0.02)",
                        border: activeSegIdx === i ? "1px solid rgba(123,92,245,0.4)" : "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-purple-400">
                          [{fmtSec(cap.start)} → {fmtSec(cap.end)}]
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <p className="text-gray-200 text-xs leading-relaxed mb-2">{cap.text}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(cap.gloss || []).map((word: string, wi: number) => (
                          <GlossToken key={word + wi} word={word} index={(i + wi)} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Avatar Panel — right 2 cols */}
              <div className="lg:col-span-2 space-y-3">
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{
                    height: 300,
                    background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.2), #0D1021 70%)",
                    border: "1px solid rgba(123,92,245,0.25)",
                  }}
                >
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading Avatar…
                    </div>
                  }>
                    <SignAvatar
                      modelUrl={`/models/${selectedAvatar === "maya" ? "Maya" : "Alex"}.glb`}
                      glossSequence={activeGloss}
                      sequentialPlay={true}
                    />
                  </Suspense>

                  {/* Gloss overlay */}
                  {activeGloss.length > 0 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap gap-1 justify-center px-3 max-w-[90%]">
                      {activeGloss.map((g, gi) => (
                        <span
                          key={gi}
                          className="text-[10px] font-black text-cyan-300 uppercase bg-black/70 backdrop-blur px-2 py-0.5 rounded-md border border-white/10 whitespace-nowrap"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Avatar label */}
                  <div className="absolute top-3 left-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    {selectedAvatar === "alex" ? "Alex" : "Maya"} · Signing
                  </div>
                </div>

                {/* Avatar switcher */}
                <div
                  className="rounded-xl p-3 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
                >
                  <span className="text-xs text-gray-400">Switch Avatar:</span>
                  <div className="flex gap-1">
                    {(["alex", "maya"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => onAvatarChange?.(a)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                          selectedAvatar === a
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                        }`}
                      >
                        {a === "alex" ? "Alex ♂" : "Maya ♀"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign playback note */}
                <div
                  className="rounded-xl p-3 text-[10px] text-gray-500 leading-relaxed"
                  style={{ background: "rgba(123,92,245,0.05)", border: "1px solid rgba(123,92,245,0.15)" }}
                >
                  <span className="text-purple-400 font-bold">How to use: </span>
                  Click any transcript segment above to make the avatar sign that gloss sequence.
                  The avatar plays each sign in order, then returns to idle.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
