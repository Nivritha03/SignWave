"use client";

import React, { useState } from 'react';
import { 
  Upload, 
  FileVideo, 
  Settings, 
  Plus, 
  Search,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/upload', formData);
      const newJob = {
        id: response.data.job_id,
        name: file.name,
        status: 'queued',
        progress: 0,
        date: new Date().toLocaleDateString()
      };
      setJobs([newJob, ...jobs]);
      
      // Poll for status
      pollJobStatus(response.data.job_id);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:8000/job/${jobId}`);
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: response.data.status, progress: response.data.progress } : job
        ));

        if (response.data.status === 'completed' || response.data.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling failed', error);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">SignWave</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 rounded-xl text-sm font-medium">
            <LayoutGrid className="w-4 h-4" />
            Projects
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
            <FileVideo className="w-4 h-4" />
            Templates
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-white/5 rounded-xl text-sm font-medium transition-colors">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="mt-auto glass p-4 rounded-2xl">
          <p className="text-xs text-muted-foreground mb-2">Storage Usage</p>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-primary" />
          </div>
          <p className="text-[10px] mt-2 font-medium">1.2 GB of 5 GB used</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-muted-foreground">Manage and track your AI translations</p>
          </div>

          <label className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-all hover:scale-105 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Translation
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </header>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Projects', value: '12', icon: FileVideo },
            { label: 'Completed', value: '8', icon: CheckCircle2 },
            { label: 'In Progress', value: '3', icon: Clock },
            { label: 'Failed', value: '1', icon: AlertCircle },
          ].map((stat, i) => (
            <div key={i} className="glass p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-green-400 font-medium">+12%</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Project List */}
        <div className="glass rounded-[32px] overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl w-96">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search projects..." className="bg-transparent border-none text-sm outline-none w-full" />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white/5 rounded-lg"><LayoutGrid className="w-4 h-4" /></button>
              <button className="p-2 text-muted-foreground"><ListIcon className="w-4 h-4" /></button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/5">
                <th className="px-8 py-4">Project Name</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Progress</th>
                <th className="px-8 py-4">Date Created</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.map((job) => (
                <tr 
                  key={job.id} 
                  className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/${job.id}`)}
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileVideo className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-semibold">{job.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      job.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      job.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500 animate-pulse'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${job.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-muted-foreground">{job.date}</td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="w-12 h-12 opacity-20" />
                      <p>No projects yet. Upload a video to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
