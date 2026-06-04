"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, Settings } from 'lucide-react';
import SignAvatar from './SignAvatar';

interface Caption {
  start: number;
  end: number;
  text: string;
  gloss: string[];
}

export default function SignVideoPlayer({ videoUrl, captions = [] }: { videoUrl: string, captions?: Caption[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentGloss, setCurrentGloss] = useState<string[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Find active caption
      const activeCaption = captions.find(c => time >= c.start && time <= c.end);
      if (activeCaption) {
        // Trigger gloss sync if different
        if (JSON.stringify(activeCaption.gloss) !== JSON.stringify(currentGloss)) {
          setCurrentGloss(activeCaption.gloss);
        }
      } else if (currentGloss.length > 0) {
        setCurrentGloss([]);
      }
    };

    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [captions, currentGloss]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Video Container */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative aspect-video bg-black rounded-[32px] overflow-hidden group border border-white/5 shadow-2xl">
          <video 
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {/* Captions Overlay */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full px-10 text-center pointer-events-none">
            {captions.map((cap, i) => (
              <div 
                key={i}
                className={`transition-all duration-300 ${
                  currentTime >= cap.start && currentTime <= cap.end 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none absolute w-full left-0'
                }`}
              >
                <p className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl inline-block text-xl font-bold border border-white/10">
                  {cap.text}
                </p>
              </div>
            ))}
          </div>

          {/* Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
            <div className="flex flex-col gap-4">
              {/* Progress Bar */}
              <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div 
                  className="absolute h-full bg-primary" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                    {isPlaying ? <Pause /> : <Play className="fill-current" />}
                  </button>
                  <div className="flex items-center gap-4">
                    <SkipBack className="w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer" />
                    <SkipForward className="w-5 h-5 opacity-50 hover:opacity-100 cursor-pointer" />
                  </div>
                  <span className="text-sm font-mono opacity-70">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Volume2 className="w-5 h-5 cursor-pointer" />
                  <Maximize className="w-5 h-5 cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-3xl">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Transcription Settings
          </h3>
          <p className="text-sm text-muted-foreground">Adjust subtitle delay or change avatar expression.</p>
        </div>
      </div>

      {/* Avatar Sidebar */}
      <div className="flex flex-col gap-6">
        <SignAvatar glossSequence={currentGloss} />
        
        <div className="glass p-6 rounded-[32px] flex-1">
          <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-6">Real-time Gloss</h4>
          <div className="space-y-4">
            {currentGloss.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentGloss.map((word, i) => (
                  <span key={i} className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-sm font-bold border border-primary/20 animate-in fade-in slide-in-from-bottom-2">
                    {word}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Waiting for speech...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
