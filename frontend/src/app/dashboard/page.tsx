"use client";

import React, { useState, useEffect } from 'react';
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
  MoreVertical,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function Dashboard() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchJobs();
  }, [router]);

  const fetchJobs = async () => {
    try {
      const token = auth.getToken();
      const response = await axios.get('http://localhost:8000/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        auth.logout();
        router.push('/login');
      }
      console.error('Failed to fetch jobs', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', auth.getToken() || '');

    try {
      const response = await axios.post('http://localhost:8000/upload', formData);
      fetchJobs();
      pollJobStatus(response.data.job_id);
    } catch (error) {
      console.error('Upload failed', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
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
          fetchJobs();
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
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col pt-10">
        <div className="flex items-center gap-3 mb-10 px-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl uppercase tracking-tighter">SignWave</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl text-sm font-bold">
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

        <button 
          onClick={handleLogout}
          className="mt-autoflex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/5 rounded-xl text-sm font-bold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Your Studio</h1>
            <p className="text-muted-foreground">Manage and track your AI translations</p>
          </div>

          <label className="bg-primary hover:bg-primary/90 text-white px-8 py-3.5 rounded-2xl font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Project
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </header>

        {/* Project List */}
        <div className="glass rounded-[40px] overflow-hidden border border-white/5 shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl w-96 ring-1 ring-white/5">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search your archive..." className="bg-transparent border-none text-sm outline-none w-full" />
            </div>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">{jobs.length} Items</span>
               <button className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-5">Project Name</th>
                <th className="px-10 py-5">Status</th>
                <th className="px-10 py-5">Analysis</th>
                <th className="px-10 py-5">Created</th>
                <th className="px-10 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {jobs.map((job) => (
                <tr 
                  key={job.id} 
                  className="group hover:bg-white/[0.02] transition-all cursor-pointer relative"
                  onClick={() => router.push(`/dashboard/${job.id}`)}
                >
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 ring-1 ring-white/5">
                        <FileVideo className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-bold text-lg">{job.name || `Session_${job.id.slice(0,6)}`}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      job.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                      job.status === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      'bg-primary/10 text-primary border border-primary/20 animate-pulse'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="w-40 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden ring-1 ring-white/5">
                        <div className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(129,140,248,0.5)]" style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold opacity-40">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-sm text-muted-foreground font-medium">{job.date}</td>
                  <td className="px-10 py-8 text-right">
                    <button className="p-2.5 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                  {/* Decorative side accent */}
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center rounded-r-full" />
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-6 opacity-20">
                      <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center animate-pulse">
                        <Upload className="w-10 h-10" />
                      </div>
                      <p className="font-bold tracking-widest uppercase text-xs">No active sessions found</p>
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
