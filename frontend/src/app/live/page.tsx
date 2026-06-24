"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import RealTimeTranscriber from "@/components/RealTimeTranscriber";
import Sidebar from "@/components/Sidebar";
import AudioWaveform from "@/components/AudioWaveform";
import { Mic, Radio } from "lucide-react";

const SignAvatar = dynamic(() => import("@/components/SignAvatar"), { ssr: false });

export default function LivePage() {
  const [glosses, setGlosses] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<"maya" | "alex">("alex");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <Sidebar />
      <div className="flex-1 ml-[220px] flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ background: "#EF4444", border: "1px solid rgba(239,68,68,0.6)" }}
          >
            <Radio className="w-3 h-3" /> LIVE
          </div>
          <h1 className="text-white font-bold text-xl">Live Sign Language Transcription</h1>
        </div>

        <div className="flex gap-5 flex-1 overflow-hidden">
          {/* Left: Controls + Waveform */}
          <div className="flex flex-col gap-4 w-72 flex-shrink-0">
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <RealTimeTranscriber onGlossChange={setGlosses} />
            </div>

            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                Live Audio Input
              </div>
              <AudioWaveform barCount={28} height={40} />
            </div>

            {/* Avatar selector */}
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">Avatar Style</div>
              <div className="grid grid-cols-2 gap-2">
                {(["maya", "alex"] as const).map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className="py-2 rounded-xl text-xs font-bold capitalize transition-all"
                    style={{
                      background: avatar === a ? "rgba(123,92,245,0.25)" : "rgba(255,255,255,0.04)",
                      color: avatar === a ? "#A78BFA" : "#6B7280",
                      border: avatar === a ? "1px solid rgba(123,92,245,0.5)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {a === "maya" ? "👩 Maya" : "👨 Alex"}
                  </button>
                ))}
              </div>
            </div>

            {/* Active gloss */}
            {glosses.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-xs text-gray-400 mb-2 font-semibold">Active Gloss</div>
                <div className="flex flex-wrap gap-1.5">
                  {glosses.map((g, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg animate-stagger-in"
                      style={{
                        background: "rgba(123,92,245,0.2)",
                        color: "#A78BFA",
                        border: "1px solid rgba(123,92,245,0.35)",
                        animationDelay: `${i * 0.04}s`,
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: 3D Avatar canvas */}
          <div
            className="flex-1 rounded-2xl overflow-hidden relative"
            style={{
              background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.2), var(--card) 70%)",
              border: "1px solid rgba(123,92,245,0.2)",
            }}
          >
            {/* Orbital ring decoration */}
            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-12 rounded-full opacity-40 animate-spin-slow"
              style={{ border: "1px solid rgba(123,92,245,0.5)", boxShadow: "0 0 30px rgba(123,92,245,0.3)" }}
            />
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Loading avatar...
              </div>
            }>
              <SignAvatar
                modelUrl={`/models/${avatar === "maya" ? "Maya" : "Alex"}.glb`}
                glossSequence={glosses}
              />
            </Suspense>

            {/* Signing indicator */}
            {glosses.length > 0 && (
              <div
                className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs text-white font-semibold"
                style={{ background: "rgba(123,92,245,0.8)", backdropFilter: "blur(8px)" }}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-blink-dot" />
                Signing: {glosses.join(" · ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
