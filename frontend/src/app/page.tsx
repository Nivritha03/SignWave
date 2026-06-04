"use client";

import React from 'react';
import { 
  Mic, 
  Video, 
  Accessibility, 
  ChevronRight, 
  Play, 
  Languages, 
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Accessibility className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">SignWave</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
        </div>

        <Link 
          href="/dashboard" 
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
        >
          Launch App
          <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />
        <div className="absolute -top-24 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 animate-fade-in">
            <Zap className="w-3 h-3 fill-primary" />
            AI-POWERED ACCESSIBILITY
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            Bridging Worlds with <br />
            <span className="gradient-text">Sign Language AI</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed capitalize">
            The ultimate accessibility studio. Convert any video, audio, or online link into 
            synchronized captions and a 3D animated sign language interpretation in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-primary/25 flex items-center justify-center gap-2"
            >
              Start Translating
              <ChevronRight className="w-5 h-5" />
            </Link>
            <button className="w-full sm:w-auto glass px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/10 flex items-center justify-center gap-2">
              Watch Demo
              <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: "Crystal Clear ASR",
                desc: "Powered by OpenAI Whisper for industry-leading speech-to-text accuracy in 90+ languages."
              },
              {
                icon: Languages,
                title: "Gloss Translation",
                desc: "Context-aware LLMs translate spoken English into actual Sign Language Gloss format."
              },
              {
                icon: Video,
                title: "3D Animation",
                desc: "High-fidelity 3D avatars perform signs in real-time, perfectly synced with the original video."
              }
            ].map((feature, i) => (
              <div key={i} className="glass p-8 rounded-3xl group hover:border-primary/50 transition-all duration-500">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-primary w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
