"use client";
import React, { useState, useEffect } from "react";

interface AudioWaveformProps {
  barCount?: number;
  color?: string;
  height?: number;
  className?: string;
  /** When false, bars are flat (mic idle) */
  active?: boolean;
}

export default function AudioWaveform({
  barCount = 32,
  color = "#7B5CF5",
  height = 32,
  className = "",
  active = true,
}: AudioWaveformProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height }}
    >
      {mounted && Array.from({ length: barCount }).map((_, i) => {
        const delay = (i * 0.05) % 0.8;
        const pseudoRandom1 = Math.abs(Math.sin(i * 100));
        const pseudoRandom2 = Math.abs(Math.cos(i * 100));
        const pseudoRandom3 = Math.abs(Math.sin(i * 200 + 50));

        const minH = active ? 3 + pseudoRandom1 * 4 : 2;
        const maxH = active ? 10 + pseudoRandom2 * (height - 14) : 3;
        const duration = 0.5 + pseudoRandom3 * 0.5;

        return (
          <div
            key={i}
            className="waveform-bar flex-1"
            style={{
              background: i % 3 === 0 ? "#22D3EE" : color,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationPlayState: active ? "running" : "paused",
              minHeight: `${minH}px`,
              maxHeight: `${maxH}px`,
              opacity: active ? 1 : 0.3,
              transition: "opacity 0.5s, min-height 0.5s, max-height 0.5s",
            }}
          />
        );
      })}
    </div>
  );
}
