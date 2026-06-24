"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Download, Share2, MoreHorizontal } from 'lucide-react';
import dynamic from 'next/dynamic';

const SignVideoPlayer = dynamic(() => import('@/components/SignVideoPlayer'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ProjectViewer() {
  const params = useParams();
  const jobId = params?.jobId as string;
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  useEffect(() => {
    if (!jobId) return;
    fetch(`${API_URL}/job/${jobId}`)
      .then(res => res.json())
      .then(data => setJob(data))
      .catch(err => console.error('Failed to fetch job', err));
  }, [jobId]);

  if (!job) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        <span className="text-white/50 uppercase tracking-widest text-xs">Loading project…</span>
      </div>
    </div>
  );

  // Parse captions — API returns either a JSON string or already-parsed array
  let captions: any[] = [];
  if (job.captions) {
    try {
      captions = typeof job.captions === 'string' ? JSON.parse(job.captions) : job.captions;
    } catch {
      captions = [];
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30">
      {/* Top Header */}
      <header className="px-8 py-4 border-b border-white/5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-bold text-lg">{job.name || `Project ${jobId?.slice(0, 8)}`}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                job.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {job.status}
              </span>
              <span className="text-[10px] text-gray-600 uppercase opacity-50">ID: {jobId}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors text-sm font-medium">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {/* Video player with real captions + avatar sync */}
        <SignVideoPlayer
          videoUrl={job.video_url || ''}
          captions={captions}
        />

        {/* Transcript Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black tracking-tight underline decoration-primary underline-offset-8">Transcript Analysis</h3>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-3 py-1 rounded-full uppercase border border-white/5">
                {captions.length} Segments
              </span>
            </div>
          </div>

          <div className="bg-white/[0.03] p-8 rounded-[40px] space-y-8 border border-white/5">
            {captions.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No transcript segments available.</p>
            )}
            {captions.map((cap: any, i: number) => (
              <div key={i} className="flex gap-10 group cursor-pointer relative py-2">
                <span className="text-xs font-mono text-gray-600 w-20 pt-1 shrink-0">
                  [{new Date(cap.start * 1000).toISOString().substr(14, 5)}]
                </span>
                <div className="flex-1">
                  <p className="text-xl group-hover:text-primary transition-all duration-300 leading-relaxed font-medium">
                    {cap.text}
                  </p>
                  <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {(cap.gloss || []).map((g: string, j: number) => (
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
