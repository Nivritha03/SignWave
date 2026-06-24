"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import SignAvatar from './SignAvatar';
import { useAvatar } from '@/context/AvatarContext';

interface Caption {
  start: number;
  end: number;
  text: string;
  gloss: string[];
}

interface SignVideoPlayerProps {
  videoUrl: string;
  captions?: Caption[];
  /** Called whenever the active caption gloss changes during playback */
  onGlossChange?: (gloss: string[]) => void;
  /** Override avatar style (from parent selector) */
  selectedAvatar?: 'maya' | 'alex';
}

export default function SignVideoPlayer({ videoUrl, captions = [], onGlossChange, selectedAvatar }: SignVideoPlayerProps) {
  const { style: avatar, setStyle: setAvatar } = useAvatar();
  const effectiveAvatar = selectedAvatar ?? avatar;
  const avatarPath = effectiveAvatar === 'maya' ? '/models/Maya.glb' : '/models/Alex.glb';
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentGloss, setCurrentGloss] = useState<string[]>([]);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Find active caption by timestamp
      const activeCaption = captions.find(c => time >= c.start && time <= c.end);
      const newGloss = activeCaption ? activeCaption.gloss : [];

      if (JSON.stringify(newGloss) !== JSON.stringify(currentGloss)) {
        setCurrentGloss(newGloss);
        onGlossChange?.(newGloss);
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay  = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => { setIsPlaying(false); setCurrentGloss([]); onGlossChange?.([]); };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [captions, currentGloss, onGlossChange]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play(); } else { video.pause(); }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    video.currentTime = ratio * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const handleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Video Container */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative aspect-video bg-black rounded-[24px] overflow-hidden group border border-white/5 shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
            crossOrigin="anonymous"
          />

          {/* Captions Overlay */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full px-8 text-center pointer-events-none z-10">
            {captions.map((cap, i) => (
              <div
                key={i}
                className={`transition-all duration-300 ${
                  currentTime >= cap.start && currentTime <= cap.end
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 pointer-events-none absolute w-full left-0'
                }`}
              >
                <p className="bg-black/70 backdrop-blur-md px-5 py-2.5 rounded-2xl inline-block text-base font-bold border border-white/10 text-white shadow-xl">
                  {cap.text}
                </p>
              </div>
            ))}
          </div>

          {/* Play/Pause overlay on click */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5 z-20">
            <div className="flex flex-col gap-3">
              {/* Seekable Progress Bar */}
              <div
                className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer hover:h-2.5 transition-all"
                onClick={handleSeek}
              >
                <div
                  className="absolute h-full rounded-full"
                  style={{
                    width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                    background: 'linear-gradient(90deg, #7B5CF5, #22D3EE)',
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="hover:scale-110 transition-transform text-white">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <span className="text-xs font-mono text-white/70">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center gap-2" onMouseLeave={() => setShowVolumeSlider(false)}>
                    <button
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onClick={() => {
                        const newVol = volume > 0 ? 0 : 1;
                        setVolume(newVol);
                        if (videoRef.current) videoRef.current.volume = newVol;
                      }}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {showVolumeSlider && (
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-purple-500"
                      />
                    )}
                  </div>
                  <button onClick={handleFullscreen} className="text-white/70 hover:text-white transition-colors">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Sidebar */}
      <div className="flex flex-col gap-5">
        <div className="flex-1 min-h-[260px]">
          <SignAvatar glossSequence={currentGloss} modelUrl={avatarPath} />
        </div>

        {/* Avatar Selection Toggle — only shown when no parent override */}
        {!selectedAvatar && (
          <div className="glass p-4 rounded-2xl flex flex-col gap-3 border border-white/5 bg-[#0A1020]/40 backdrop-blur-xl">
            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Select Avatar</h4>
            <div className="grid grid-cols-2 gap-2">
              {(['maya', 'alex'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 gap-1 cursor-pointer ${
                    effectiveAvatar === a
                      ? a === 'maya'
                        ? 'bg-electric-violet/20 border-electric-violet/60 text-white'
                        : 'bg-cyan-glow/20 border-cyan-glow/60 text-white'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                    a === 'maya' ? 'bg-gradient-to-tr from-purple-500 to-pink-500' : 'bg-gradient-to-tr from-blue-500 to-cyan-500'
                  }`}>
                    {a === 'maya' ? 'M' : 'A'}
                  </div>
                  <span>{a === 'maya' ? 'Maya (F)' : 'Alex (M)'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Gloss Display */}
        <div className="glass p-5 rounded-2xl">
          <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3">Active Gloss</h4>
          {currentGloss.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {currentGloss.map((word, i) => (
                <span key={i} className="px-3 py-1.5 bg-primary/20 text-primary rounded-xl text-xs font-bold border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                  {word}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Play video to see live sign gloss…</p>
          )}
        </div>
      </div>
    </div>
  );
}

