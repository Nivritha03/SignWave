"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { RotateCcw, Maximize2, Share2, Radio, Clock, Mic, MicOff, StopCircle } from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import dynamic from "next/dynamic";

const SignAvatar = dynamic(() => import("./SignAvatar"), { ssr: false });

const PARTICIPANTS = [
  { name: "Ravi K.",   initials: "RK", color: "#7B5CF5" },
  { name: "Sruthi A.", initials: "SA", color: "#22D3EE" },
  { name: "Bindu P.",  initials: "BP", color: "#F59E0B" },
];

// Simple text → ASL gloss converter (uppercase words, drop fillers)
const STOP_WORDS = new Set(["THE", "A", "AN", "IS", "AM", "ARE", "WAS", "WERE", "TO", "OF", "BE", "IN", "ON", "AT"]);
function textToGloss(text: string): string[] {
  return text
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w))
    .slice(-6); // show last 6 gloss tokens for avatar
}

function useElapsedTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [running]);

  const reset = () => { setElapsed(0); startRef.current = null; };

  const formatted = [
    String(Math.floor(elapsed / 3600)).padStart(2, "0"),
    String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0"),
    String(elapsed % 60).padStart(2, "0"),
  ].join(":");

  return { formatted, reset };
}

export default function LiveStudio() {
  const [captionOn, setCaptionOn] = useState(true);
  const [signOn, setSignOn]       = useState(true);
  const [language, setLanguage]   = useState("en-US");
  const [isLive, setIsLive]       = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [activeGloss, setActiveGloss]       = useState<string[]>([]);
  const [isAudioActive, setIsAudioActive]   = useState(false);

  const wsRef        = useRef<WebSocket | null>(null);
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const captionEndRef = useRef<HTMLDivElement>(null);

  const { formatted: elapsed, reset: resetTimer } = useElapsedTimer(isLive);

  // Auto-scroll captions
  useEffect(() => {
    captionEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveTranscript]);

  const stopLive = useCallback(() => {
    wsRef.current?.close();
    processorRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current = null;
    audioCtxRef.current = null;
    processorRef.current = null;
    streamRef.current = null;
    setIsLive(false);
    setIsAudioActive(false);
  }, []);

  const startLive = async () => {
    try {
      // 1. Open WebSocket
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsUrl  = apiUrl.replace(/^http/, "ws") + `/ws/transcribe?lang=${language}`;
      const ws     = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => console.log("[LiveStudio] WebSocket opened");
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.text && data.text.trim()) {
            setLiveTranscript(prev => [...prev.slice(-40), data.text.trim()]);
            if (signOn) setActiveGloss(textToGloss(data.text));
          }
        } catch { /* ignore parse errors */ }
      };
      ws.onerror = (err) => console.error("[LiveStudio] WS error", err);
      ws.onclose = () => { setIsAudioActive(false); };

      // 2. Open microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const channelData = e.inputBuffer.getChannelData(0);
        const buf = new ArrayBuffer(channelData.length * 2);
        const view = new DataView(buf);
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        ws.send(buf);
      };

      setIsLive(true);
      setIsAudioActive(true);
      setLiveTranscript([]);
      setActiveGloss([]);
    } catch (err: any) {
      console.error("[LiveStudio] Failed to start:", err);
      alert(`Could not start live transcription: ${err.message || err}`);
      stopLive();
    }
  };

  const handleToggleLive = () => {
    if (isLive) {
      stopLive();
      resetTimer();
    } else {
      startLive();
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-white font-semibold text-sm">Live Studio</span>
          <span
            className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={isLive
              ? { background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)" }
              : { background: "rgba(156,163,175,0.1)", color: "#6B7280", border: "1px solid rgba(156,163,175,0.2)" }
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 animate-blink-dot" : "bg-gray-500"}`} />
            {isLive ? "LIVE" : "IDLE"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4">
        {/* Participant thumbnails grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Main speaker / mic indicator */}
          <div
            className="col-span-2 rounded-xl overflow-hidden relative"
            style={{ aspectRatio: "16/9", background: "#0D1021" }}
          >
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white"
              style={{ background: isLive ? "#DC2626" : "rgba(107,114,128,0.5)" }}>
              <Radio className="w-2.5 h-2.5" />
              {isLive ? "LIVE" : "OFF"}
            </div>
            <div
              className="w-full h-full flex items-end p-3"
              style={{ background: "radial-gradient(circle at 40% 30%, rgba(60,50,120,0.8), #0D1021)" }}
            >
              {/* Scrolling live captions */}
              {captionOn && liveTranscript.length > 0 && (
                <p className="text-white text-[10px] leading-tight max-w-[90%] opacity-90 line-clamp-3">
                  {liveTranscript.slice(-3).join(" ")}
                </p>
              )}
            </div>
          </div>

          {/* Participant thumbnails */}
          <div className="flex flex-col gap-2">
            {PARTICIPANTS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl flex items-center justify-center text-white font-bold text-sm flex-1"
                style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}
              >
                <span style={{ color: p.color }}>{p.initials}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar signing area */}
        <div
          className="rounded-xl relative overflow-hidden flex-1 min-h-[160px]"
          style={{
            background: "radial-gradient(circle at 50% 80%, rgba(123,92,245,0.15), #0D1021 70%)",
            border: `1px solid ${isLive && signOn ? "rgba(123,92,245,0.4)" : "rgba(123,92,245,0.15)"}`,
            transition: "border-color 0.3s",
          }}
        >
          <div className="w-full h-full">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                Loading avatar…
              </div>
            }>
              <SignAvatar modelUrl="/models/Alex.glb" glossSequence={signOn ? activeGloss : []} />
            </Suspense>
          </div>
          {/* Current gloss overlay */}
          {signOn && activeGloss.length > 0 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10 max-w-[90%] overflow-x-hidden">
              {activeGloss.map((g, i) => (
                <span key={i} className="text-[9px] font-bold text-cyan-300 uppercase whitespace-nowrap">{g}</span>
              ))}
            </div>
          )}
        </div>

        {/* Live status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            {isLive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-blink-dot" />
                <span className="text-green-400 font-medium">Listening…</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <span>Ready</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Clock className="w-3 h-3" />
            {elapsed}
          </div>
        </div>

        {/* Waveform */}
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(123,92,245,0.06)", border: "1px solid rgba(123,92,245,0.15)" }}
        >
          <AudioWaveform barCount={36} height={28} active={isAudioActive} />
        </div>

        {/* Live caption feed */}
        {captionOn && (
          <div
            className="rounded-xl p-3 max-h-28 overflow-y-auto space-y-1"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border)" }}
          >
            {liveTranscript.length === 0 ? (
              <p className="text-gray-600 text-[10px] italic">Live captions will appear here when you start…</p>
            ) : (
              liveTranscript.map((line, i) => (
                <p key={i} className={`text-[10px] leading-snug ${i === liveTranscript.length - 1 ? "text-white font-medium" : "text-gray-500"}`}>
                  {line}
                </p>
              ))
            )}
            <div ref={captionEndRef} />
          </div>
        )}

        {/* Toggles */}
        <div className="space-y-2">
          {[
            { label: "Auto Caption",  on: captionOn, set: setCaptionOn },
            { label: "Sign Language", on: signOn,    set: setSignOn    },
          ].map(({ label, on, set }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-gray-300 text-xs">{label}</span>
              <button
                onClick={() => set(!on)}
                className="relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0"
                style={{ background: on ? "#7B5CF5" : "rgba(255,255,255,0.1)" }}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300"
                  style={{ left: on ? "calc(100% - 18px)" : "2px" }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Language selector */}
        <select
          className="w-full bg-transparent border rounded-lg px-3 py-2 text-xs text-gray-300 outline-none cursor-pointer"
          style={{ borderColor: "var(--border)" }}
          value={language}
          onChange={e => setLanguage(e.target.value)}
          disabled={isLive}
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>

        {/* Start / Stop Live button */}
        <button
          onClick={handleToggleLive}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
            isLive
              ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30"
              : "text-white border border-purple-500/30 hover:border-purple-500/60"
          }`}
          style={isLive ? {} : { background: "linear-gradient(135deg, #7B5CF5, #9B7FFF)" }}
        >
          {isLive ? (
            <><StopCircle className="w-4 h-4" /> Stop Live Session</>
          ) : (
            <><Mic className="w-4 h-4" /> Start Live Transcription</>
          )}
        </button>

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-purple-400 animate-blink-dot" : "bg-gray-600"}`} />
            {isLive ? "NEURAL LINK ACTIVE" : "NEURAL LINK IDLE"}
          </span>
          <button onClick={() => { setLiveTranscript([]); setActiveGloss([]); }} className="text-gray-500 hover:text-white transition-colors">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
