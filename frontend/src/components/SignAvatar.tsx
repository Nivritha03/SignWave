"use client";

import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
    useGLTF, 
    useAnimations, 
    PerspectiveCamera, 
    Environment, 
    OrbitControls, 
    ContactShadows,
    Html
} from '@react-three/drei';
import * as THREE from 'three';

// High-quality public Ready Player Me avatar
const AVATAR_URL = 'https://models.readyplayer.me/648580f1a4e402fd9ee2e76f.glb';

function Avatar({ glossSequence }: { glossSequence: string[] }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions, names } = useAnimations(animations, group);
  const [currentGloss, setCurrentGloss] = useState<string | null>(null);

  // Map glosses to animation names (assuming the model has these or similar)
  // For RPM models, they often have standard names like 'Armature|mixamo.com|Layer0'
  // In a real dictionary app, these would be separate .glb animation files.
  useEffect(() => {
    if (!glossSequence || glossSequence.length === 0) return;

    let index = 0;
    let isMounted = true;

    const playSequence = async () => {
      while (index < glossSequence.length && isMounted) {
        const gloss = glossSequence[index];
        setCurrentGloss(gloss);
        
        // Find a matching animation or play a generic "sign" animation
        // For now, we'll pulse the arms using a generic animation name if found
        const actionName = names.find(n => n.toLowerCase().includes(gloss.toLowerCase())) || names[0];
        
        if (actions[actionName]) {
          actions[actionName].reset().fadeIn(0.2).play();
          // Duration of the animation
          const duration = actions[actionName].getClip().duration * 1000;
          await new Promise(resolve => setTimeout(resolve, duration || 1200));
          actions[actionName].fadeOut(0.2);
        } else {
          // If no specific animation, just wait
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        index++;
      }
      if (isMounted) setCurrentGloss(null);
    };

    playSequence();
    return () => { isMounted = false; };
  }, [glossSequence, actions, names]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={1.8} position={[0, -1.5, 0]} />
      {currentGloss && (
        <Html position={[0, 1.2, 0]} center>
          <div className="px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full shadow-2xl border border-white/20 whitespace-nowrap animate-bounce uppercase">
            Sign: {currentGloss}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function SignAvatar({ glossSequence = [] }: { glossSequence?: string[] }) {
  return (
    <div className="w-full h-full min-h-[500px] relative rounded-[40px] overflow-hidden bg-[#0a0a0a] border border-white/5 shadow-2xl">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={45} />
        <Environment preset="studio" />
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} castShadow />
        <spotLight position={[-5, 5, 5]} angle={0.25} penumbra={1} intensity={1} />
        
        <Suspense fallback={
          <Html center>
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Summoning Avatar...</p>
            </div>
          </Html>
        }>
          <Avatar glossSequence={glossSequence} />
          <ContactShadows opacity={0.6} scale={10} blur={2} far={10} resolution={256} color="#000000" />
        </Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.8} 
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Floating UI */}
      <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 glass rounded-full ring-1 ring-white/10">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Studio Engine v1.0</span>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 group">
        <div className="glass p-4 rounded-3xl group-hover:scale-105 transition-transform">
           <p className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1">Status</p>
           <p className="text-sm font-semibold">Active Interpreter</p>
        </div>
      </div>
    </div>
  );
}

// Preload the model
useGLTF.preload(AVATAR_URL);
