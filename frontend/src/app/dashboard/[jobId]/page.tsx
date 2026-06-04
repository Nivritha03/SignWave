"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Download, Share2, MoreHorizontal } from 'lucide-react';
import axios from 'axios';
import SignVideoPlayer from '@/components/SignVideoPlayer';

export default function ProjectViewer() {
  const { jobId } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/job/${jobId}`);
        setJob(response.data);
      } catch (error) {
        console.error('Failed to fetch job', error);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.post(`http://localhost:8000/export/${jobId}`);
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error) {
      console.error('Export failed', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!job) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white/50 animate-pulse uppercase tracking-widest text-xs">Accessing Secure Link...</div>;

  const mockCaptions = [
    { start: 0, end: 3, text: "Hello everyone!", gloss: ["HELLO", "EVERYONE"] },
    { start: 3.5, end: 7, text: "Welcome back to the channel.", gloss: ["WELCOME", "BACK", "CHANNEL"] },
    { start: 7.5, end: 11, text: "Today we discuss neural networks.", gloss: ["TODAY", "DISCUSS", "NEURAL", "NETWORK"] },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      {/* Top Header */}
      <header className="px-8 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 glass">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg">{job.name || "SignWave Analysis"}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                job.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {job.status}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase opacity-50">ID: {jobId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting || job.status !== 'completed'}
            className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 rounded-xl transition-all font-bold text-sm disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {isExporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Processing Export...' : 'Export Final Video'}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        <SignVideoPlayer 
          videoUrl={job.video_url || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} 
          captions={job.captions || mockCaptions}
        />

        {/* Transcript Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black tracking-tight underline decoration-primary underline-offset-8">Transcript Analysis</h3>
            <div className="flex gap-2">
               <span className="text-[10px] font-bold text-muted-foreground glass px-3 py-1 rounded-full uppercase">94% Confidence</span>
            </div>
          </div>
          
          <div className="glass p-8 rounded-[40px] space-y-8 border border-white/5">
            {(job.captions || mockCaptions).map((cap: any, i: number) => (
              <div key={i} className="flex gap-10 group cursor-pointer relative py-2">
                <span className="text-xs font-mono text-muted-foreground/40 w-20 pt-1 shrink-0">
                  [{new Date(cap.start * 1000).toISOString().substr(14, 5)}]
                </span>
                <div className="flex-1">
                  <p className="text-xl group-hover:text-primary transition-all duration-300 leading-relaxed font-medium">
                    {cap.text}
                  </p>
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {cap.gloss.map((g: string, j: number) => (
                      <span key={j} className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 uppercase tracking-widest">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
