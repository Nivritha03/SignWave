"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import SignAvatar from "@/components/SignAvatar";
import { Section } from "@/components/Section";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  Upload, AudioWaveform, FileText, Languages, Video, BarChart3, 
  CheckCircle2, Play, Users, Globe2, Shield, Zap, Sparkles, MoveRight
} from "lucide-react";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const demoGloss = ['HELLO', 'WELCOME', 'FUTURE', 'ACCESSIBILITY'];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden font-sans">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 aurora-bg opacity-40"></div>
      
      {/* --- SECTION 1: FULLSCREEN HERO --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border-primary/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">SignWave AI OS 2.0</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[1.1]">
              Transform Speech Into <br />
              <span className="gradient-text">Accessible Communication</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Convert videos, meetings, podcasts, and live conversations into AI-powered captions, transcripts, and lifelike sign language animations in real-time.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Link href="/dashboard" className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition shadow-[0_0_40px_-10px_rgba(124,92,255,0.5)] flex items-center gap-2">
                Start Creating <MoveRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 glass-card rounded-2xl font-semibold hover:bg-white/10 transition flex items-center gap-2">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs">U{i}</div>
                ))}
              </div>
              <p>Trusted by educators, creators, and accessibility advocates.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative h-[600px] w-full rounded-3xl glass-card overflow-hidden border border-primary/20 flex items-center justify-center group"
          >
            {/* Holographic chamber effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-primary/20"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-primary/30 blur-[80px] rounded-full"></div>
            
            <div className="w-full h-full relative z-10 p-4">
              <SignAvatar glossSequence={demoGloss} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- SECTION 2: HOW IT WORKS --- */}
      <Section className="px-6 bg-card/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">The SignWave Pipeline</h2>
            <p className="text-muted-foreground text-lg">Five steps from audio to fully accessible animated content.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: 1, title: "Upload", icon: <Upload />, desc: "Video, Audio, or Link" },
              { step: 2, title: "Transcribe", icon: <AudioWaveform />, desc: "Whisper AI Engine" },
              { step: 3, title: "Caption", icon: <FileText />, desc: "Context-aware generation" },
              { step: 4, title: "Translate", icon: <Languages />, desc: "Semantic ASL Gloss" },
              { step: 5, title: "Animate", icon: <Video />, desc: "3D Avatar Rendering" }
            ].map((s, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="glass-card p-6 rounded-2xl relative flex flex-col items-center text-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  {s.icon}
                </div>
                <h3 className="font-bold text-lg">Step {s.step}: {s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < 4 && <div className="hidden md:block absolute -right-3 top-1/2 text-primary/50"><MoveRight/></div>}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 3: LIVE PRODUCT DEMO --- */}
      <Section className="px-6 relative">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">See It In Action</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
            <div className="glass-card rounded-2xl p-4 flex items-center justify-center border-border">
              <div className="w-full h-full bg-secondary rounded-xl flex items-center justify-center">
                 <Video className="w-12 h-12 text-muted-foreground/50" />
                 <span className="ml-2 text-muted-foreground font-medium">Source Video</span>
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border-border overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
               <h3 className="font-bold border-b border-border pb-2">Live Transcript stream</h3>
               <div className="space-y-4 flex-1 overflow-auto opacity-70">
                 <p className="text-sm"><span className="text-primary mr-2">00:01</span> Welcome to the future of AI.</p>
                 <p className="text-sm"><span className="text-primary mr-2">00:05</span> Today we demonstrate real-time translation.</p>
               </div>
               <div className="mt-auto flex items-center justify-between text-xs">
                 <span className="text-emerald-success flex items-center gap-1"><Zap className="w-3 h-3"/> 99% Confidence</span>
                 <span className="bg-primary/20 text-primary px-2 py-1 rounded">English &rarr; ASL</span>
               </div>
            </div>
            
            <div className="glass-card rounded-2xl p-4 relative border-border border-primary/30 shadow-[0_0_30px_-5px_rgba(34,211,238,0.2)]">
               <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs border border-white/10 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-success animate-pulse"></span>
                 Active Avatar
               </div>
               <SignAvatar glossSequence={['WELCOME', 'FUTURE', 'AI']} />
            </div>
          </div>
        </div>
      </Section>

      {/* --- SECTION 4: FEATURES --- */}
      <Section className="px-6 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Unmatched Capabilities</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "AI Captioning", desc: "Context-aware subtitles synced perfectly with audio." },
              { title: "Speech-to-Text", desc: "Whisper-powered transcription with speaker diarization." },
              { title: "Live Translation", desc: "Instantly convert spoken English into ASL Gloss." },
              { title: "Sign Language Avatar", desc: "Lifelike 3D rendering with emotion and fluid motion." },
              { title: "Multi-Language", desc: "Translate from 50+ languages into universal signs." },
              { title: "Accessibility Analytics", desc: "Track your impact and compliance metrics." }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-8 rounded-3xl border border-white/5 hover:border-primary/50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 5: ACCESSIBILITY IMPACT --- */}
      <Section className="px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto glass-card rounded-3xl p-12 border border-primary/20">
          <h2 className="text-3xl font-bold text-center mb-12">Global Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Words Processed", val: "10M+" },
              { label: "Minutes Translated", val: "500K+" },
              { label: "Accuracy", val: "99%" },
              { label: "Languages", val: "50+" }
            ].map((s, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-extrabold gradient-text mb-2">{s.val}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 6: USE CASES --- */}
      <Section className="px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center">Built For Every Industry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {['Education', 'Corporate Meetings', 'Healthcare', 'Content Creators'].map((useCase, i) => (
               <motion.div key={i} whileHover={{ y: -5 }} className="glass-card p-6 rounded-2xl h-64 flex flex-col justify-end group overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                 <h3 className="text-2xl font-bold relative z-20 group-hover:text-primary transition-colors">{useCase}</h3>
               </motion.div>
             ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 7: TESTIMONIALS --- */}
      <Section className="px-6 bg-card/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-12">What Our Users Say</h2>
          <div className="glass-card p-12 rounded-3xl relative">
             <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50 text-2xl">"</div>
             <p className="text-2xl italic text-muted-foreground mb-8">
               "SignWave has completely transformed how our university delivers online lectures. The AI avatar is incredibly lifelike and the translation speed is unparalleled."
             </p>
             <div>
               <div className="font-bold text-lg">Dr. Sarah Jenkins</div>
               <div className="text-sm text-primary">Director of Accessibility, Tech University</div>
             </div>
          </div>
        </div>
      </Section>

      {/* --- SECTION 8: AI TECH STACK --- */}
      <Section className="px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Neural Architecture</h2>
            <p className="text-muted-foreground">Powered by state-of-the-art machine learning models.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-card p-8 rounded-3xl">
             {['Speech', 'Transcription', 'Captioning', 'Translation', 'Gloss', 'Animation'].map((step, i) => (
               <div key={i} className="flex items-center gap-4">
                 <div className="px-4 py-2 rounded-lg bg-secondary/50 border border-white/10 font-mono text-sm">
                   {step}
                 </div>
                 {i < 5 && <MoveRight className="text-primary hidden md:block" />}
                 {i < 5 && <MoveRight className="text-primary rotate-90 md:hidden my-2" />}
               </div>
             ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 9: PRICING --- */}
      <Section className="px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { name: "Starter", price: "$0", desc: "For individuals", popular: false },
               { name: "Professional", price: "$49", desc: "For creators & small teams", popular: true },
               { name: "Enterprise", price: "Custom", desc: "For large organizations", popular: false }
             ].map((p, i) => (
               <div key={i} className={cn("glass-card p-8 rounded-3xl relative flex flex-col", p.popular ? "border-primary shadow-[0_0_30px_-5px_rgba(124,92,255,0.3)] scale-105 z-10" : "border-white/5")}>
                 {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>}
                 <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                 <div className="text-4xl font-extrabold mb-2">{p.price}<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                 <p className="text-muted-foreground mb-8">{p.desc}</p>
                 <button className={cn("mt-auto py-3 rounded-xl font-bold transition", p.popular ? "bg-primary text-white hover:bg-primary/90" : "bg-white/10 hover:bg-white/20")}>
                   Choose Plan
                 </button>
               </div>
             ))}
          </div>
        </div>
      </Section>

      {/* --- SECTION 10: FINAL CTA --- */}
      <Section className="px-6 pb-32">
        <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden p-16 text-center border border-primary/30">
          <div className="absolute inset-0 animated-bg opacity-50 z-0"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Make Every Conversation <br/> Accessible</h2>
            <p className="text-xl text-white/80 max-w-2xl mb-10">
              Bring AI-powered accessibility to your videos, meetings, classrooms, and communities today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition shadow-xl">
                Get Started Free
              </Link>
              <button className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition shadow-xl">
                Book a Demo
              </button>
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
}
