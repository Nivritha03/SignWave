"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Upload, AudioWaveform, FileText, Languages, Video, 
  Play, Users, Zap, Sparkles, MoveRight, Layers, Activity, BrainCircuit, Mic
} from "lucide-react";
import SignAvatar from "@/components/SignAvatar";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ensure GSAP plugins are registered
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const NeuralBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-40 overflow-hidden mix-blend-screen">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-electric-violet/20 blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-neon-blue/10 blur-[150px]"></div>
      <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-cyan-glow/15 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
    </div>
  );
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    // Advanced GSAP animations for sections
    const sections = gsap.utils.toArray('.gsap-section');
    sections.forEach((sec: any) => {
      gsap.fromTo(sec, 
        { y: 100, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 1.2, ease: "power3.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    });
  }, []);

  const [glosses, setGlosses] = useState<string[]>(['HELLO', 'WELCOME', 'FUTURE', 'ACCESSIBILITY']);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-electric-violet selection:text-white">
      <NeuralBackground />
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-24 pb-12 px-6 z-10">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 flex flex-col gap-8 z-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border border-electric-violet/30 shadow-[0_0_20px_rgba(124,92,255,0.2)] backdrop-blur-xl"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse"></div>
              <span className="text-sm font-semibold tracking-wide text-gray-200">SignWave AI Engine v2.0 Live</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[1.05]"
            >
              Transform Speech Into <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-violet via-neon-blue to-cyan-glow drop-shadow-lg">
                Accessible Reality
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed font-light"
            >
              Convert videos, meetings, and podcasts into real-time transcripts, captions, and hyper-realistic 3D sign language animations. The future of accessibility is here.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center gap-4 mt-4"
            >
              <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2 group">
                Start Creating <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto px-8 py-4 glass rounded-full font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                <Play className="w-5 h-5 group-hover:text-cyan-glow transition-colors" /> Watch Demo
              </button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
              className="mt-8 flex items-center gap-6 pt-8 border-t border-white/10"
            >
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">10M+</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Words Processed</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">99%</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Accuracy</span>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-bold text-white">50+</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest">Languages</span>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5 relative h-[650px] w-full rounded-[2rem] glass overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(124,92,255,0.15)] flex items-center justify-center group"
          >
            {/* Inner holographic chamber glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-electric-violet/5 via-transparent to-neon-blue/10 z-0"></div>
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-xs text-gray-300">
              <Activity className="w-3 h-3 text-emerald-success animate-pulse" /> Live Neural Sync
            </div>
            <div className="w-full h-full relative z-10 p-2 mix-blend-lighten">
              <SignAvatar glossSequence={glosses} />
            </div>
            {/* Floating UI Elements */}
            <div className="absolute bottom-6 left-6 z-20 glass px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-full bg-electric-violet/20 flex items-center justify-center">
                <Mic className="w-5 h-5 text-electric-violet" />
              </div>
              <div>
                <div className="text-xs text-gray-400">AI-Powered Detection</div>
                <div className="text-sm font-semibold text-white">&quot;Welcome to the future&quot;</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* --- HOW IT WORKS (PIPELINE) --- */}
      <section className="py-32 px-6 relative z-10 gsap-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 flex flex-col items-center">
            <div className="px-4 py-1.5 rounded-full glass text-sm text-cyan-glow mb-6 border border-cyan-glow/30">AI Pipeline</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">How SignWave Works</h2>
            <p className="text-gray-400 text-lg max-w-2xl">A seamless, five-step neural network pipeline converting raw audio into an expressive 3D sign language performance.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Animated Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-white/5 -translate-y-1/2 z-0">
              <div className="h-full bg-gradient-to-r from-electric-violet via-cyan-glow to-electric-violet w-1/3 animate-[gradientBG_3s_linear_infinite] shadow-[0_0_10px_#22D3EE]"></div>
            </div>

            {[
              { step: "01", title: "Ingest", icon: <Upload />, desc: "Upload video or stream live audio." },
              { step: "02", title: "Transcribe", icon: <AudioWaveform />, desc: "Whisper AI extracts speech with 99% accuracy." },
              { step: "03", title: "Context", icon: <FileText />, desc: "LLMs analyze semantics and generate captions." },
              { step: "04", title: "Translate", icon: <Languages />, desc: "Convert text to linguistic ASL Gloss structure." },
              { step: "05", title: "Animate", icon: <Video />, desc: "Real-time rendering of 3D avatar gestures." }
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass p-6 rounded-3xl relative z-10 flex flex-col bg-[#0A1020]/80 border border-white/5 hover:border-electric-violet/50 transition-all group shadow-xl"
              >
                <div className="text-xs font-mono text-gray-500 mb-4">{s.step}</div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white mb-6 group-hover:bg-electric-violet/20 group-hover:text-electric-violet transition-colors border border-white/5">
                  {s.icon}
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- LIVE DEMO SHOWCASE --- */}
      <section className="py-32 px-6 relative z-10 bg-black/40 border-y border-white/5 gsap-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Product Demo</h2>
              <p className="text-gray-400 text-lg max-w-xl">Watch our proprietary translation engine synchronize captions and avatar movements with millisecond precision.</p>
            </div>
            <button className="px-6 py-3 rounded-full glass border border-white/10 hover:bg-white/5 flex items-center gap-2 text-sm font-medium">
              <Layers className="w-4 h-4"/> View Full Studio
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px]">
            {/* Left: Video */}
            <div className="lg:col-span-4 glass rounded-[2rem] p-4 flex flex-col border border-white/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10 pointer-events-none"></div>
              <div className="w-full h-full bg-[#111] rounded-2xl flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                 <button className="w-16 h-16 rounded-full glass bg-white/10 backdrop-blur-md flex items-center justify-center z-20 hover:scale-110 transition-transform">
                   <Play className="w-6 h-6 text-white ml-1" />
                 </button>
              </div>
              <div className="absolute bottom-6 left-6 z-20">
                <div className="text-sm font-semibold text-white">Source Input</div>
                <div className="text-xs text-gray-400">English • Tech Keynote</div>
              </div>
            </div>
            
            {/* Center: Transcript */}
            <div className="lg:col-span-3 glass rounded-[2rem] p-6 flex flex-col gap-4 border border-white/10 relative overflow-hidden">
               <div className="flex items-center justify-between border-b border-white/10 pb-4">
                 <h3 className="font-semibold text-white flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-electric-violet"/> AI Analysis</h3>
               </div>
               <div className="space-y-6 flex-1 overflow-auto opacity-80 pt-2 pr-2 custom-scrollbar">
                 <div className="flex flex-col gap-1">
                   <div className="text-xs text-electric-violet font-mono">00:01:23</div>
                   <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">Welcome everyone to our annual keynote presentation.</p>
                 </div>
                 <div className="flex flex-col gap-1">
                   <div className="text-xs text-cyan-glow font-mono flex items-center gap-2">00:01:28 <span className="w-2 h-2 rounded-full bg-cyan-glow animate-pulse"></span> Processing</div>
                   <p className="text-sm text-white bg-electric-violet/20 p-3 rounded-xl border border-electric-violet/30 shadow-[0_0_15px_rgba(124,92,255,0.2)]">Today, we are thrilled to unveil a breakthrough in accessible technology.</p>
                 </div>
                 <div className="flex flex-col gap-1 opacity-40">
                   <div className="text-xs text-gray-500 font-mono">00:01:35</div>
                   <p className="text-sm text-gray-400 p-3">This changes everything.</p>
                 </div>
               </div>
               <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                 <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium border border-emerald-500/20">
                   <Zap className="w-3 h-3"/> 99.8% Confidence
                 </span>
               </div>
            </div>
            
            {/* Right: Avatar */}
            <div className="lg:col-span-5 glass rounded-[2rem] p-2 relative border border-cyan-glow/30 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)] overflow-hidden">
               <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                 <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2 w-fit">
                   <span className="w-2 h-2 rounded-full bg-emerald-success animate-pulse"></span> Avatar Engine Active
                 </div>
                 <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-gray-300 border border-white/5 w-fit">
                   Gloss: [TODAY] [EXCITED] [ANNOUNCE] [BREAKTHROUGH]
                 </div>
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-cyan-glow/10 to-transparent pointer-events-none"></div>
               <SignAvatar glossSequence={['WELCOME', 'FUTURE', 'ACCESSIBILITY']} />
            </div>
          </div>
        </div>
      </section>

      {/* --- DASHBOARD PREVIEW --- */}
      <section className="py-32 px-6 relative z-10 gsap-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Manage Projects with Ease</h2>
            <p className="text-gray-400 text-lg">A beautiful, intuitive dashboard designed for creators and enterprises.</p>
          </div>
          
          <div className="glass rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-electric-violet/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
               {[
                 { title: "Q3 Earnings Call", status: "Completed", progress: 100, time: "2h ago", image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=600&auto=format&fit=crop" },
                 { title: "Product Launch Video", status: "Processing", progress: 68, time: "Just now", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop" },
                 { title: "University Lecture 101", status: "Queued", progress: 0, time: "Pending", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop" }
               ].map((project, i) => (
                 <motion.div key={i} whileHover={{ y: -8 }} className="bg-[#0A1020] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                   <div className="h-32 w-full relative overflow-hidden">
                     <img src={project.image} alt={project.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0A1020] to-transparent"></div>
                   </div>
                   <div className="p-5">
                     <h4 className="font-semibold text-white mb-1 truncate">{project.title}</h4>
                     <p className="text-xs text-gray-400 mb-4">{project.time}</p>
                     
                     <div className="flex items-center justify-between text-xs mb-2">
                       <span className={cn("font-medium", project.status === 'Completed' ? "text-emerald-400" : project.status === 'Processing' ? "text-cyan-glow" : "text-gray-500")}>
                         {project.status}
                       </span>
                       <span className="text-gray-400">{project.progress}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={cn("h-full rounded-full relative", project.status === 'Completed' ? "bg-emerald-500" : "bg-cyan-glow")} 
                         style={{ width: `${project.progress}%` }}
                       >
                         {project.progress > 0 && project.progress < 100 && (
                           <div className="absolute inset-0 bg-white/30 animate-[pulse_1s_infinite]"></div>
                         )}
                       </div>
                     </div>
                   </div>
                 </motion.div>
               ))}
            </div>
            
            <div className="mt-12 flex justify-center">
              <Link href="/dashboard" className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-sm font-medium border border-white/10 transition-colors flex items-center gap-2">
                Go to Dashboard <MoveRight className="w-4 h-4"/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section className="py-32 px-6 relative z-10 gsap-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-gray-400 text-lg">Scale your accessibility efforts effortlessly.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { name: "Starter", price: "$0", desc: "Perfect for individuals and small projects.", popular: false, features: ["50 mins/month", "Standard Avatar", "720p Export", "Community Support"] },
               { name: "Pro", price: "$49", desc: "For creators and accessibility professionals.", popular: true, features: ["500 mins/month", "Premium Avatars", "4K Export", "API Access", "Priority Support"] },
               { name: "Enterprise", price: "Custom", desc: "Dedicated infrastructure for large organizations.", popular: false, features: ["Unlimited Processing", "Custom Avatar Integration", "SSO & Advanced Security", "SLA & 24/7 Support"] }
             ].map((p, i) => (
               <div key={i} className={cn("glass p-8 rounded-[2.5rem] relative flex flex-col transition-all duration-300", p.popular ? "bg-[#0A1020]/90 border-electric-violet/50 shadow-[0_0_50px_-15px_rgba(124,92,255,0.4)] scale-105 z-20" : "bg-[#0A1020]/50 border-white/5 hover:border-white/20")}>
                 {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-electric-violet to-cyan-glow text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">MOST POPULAR</div>}
                 
                 <h3 className="text-xl font-bold mb-2 text-white">{p.name}</h3>
                 <p className="text-sm text-gray-400 mb-6 min-h-[40px]">{p.desc}</p>
                 <div className="text-5xl font-extrabold mb-8 text-white">{p.price}<span className="text-lg text-gray-500 font-normal">/mo</span></div>
                 
                 <div className="space-y-4 mb-10 flex-1">
                   {p.features.map((f, idx) => (
                     <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                       <Zap className="w-4 h-4 text-cyan-glow shrink-0" /> {f}
                     </div>
                   ))}
                 </div>
                 
                 <button className={cn("w-full py-4 rounded-xl font-bold transition-all duration-300", p.popular ? "bg-white text-black hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/5 text-white hover:bg-white/15 border border-white/10")}>
                   Get Started
                 </button>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 px-6 relative z-10 gsap-section">
        <div className="max-w-6xl mx-auto relative rounded-[3rem] overflow-hidden p-16 md:p-24 text-center border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-electric-violet/20 via-background to-cyan-glow/20 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter leading-tight text-white">
              Ready to make the web <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-violet to-cyan-glow">truly accessible?</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mb-12">
              Join thousands of creators and enterprises using SignWave to break down communication barriers.
            </p>
            <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] text-lg">
                Start Creating Free
              </Link>
              <button className="w-full sm:w-auto px-10 py-5 glass border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all text-lg">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
