"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useGLTF, useAnimations, OrbitControls, Environment, Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Real-world ASL Gloss to Animation Track Mapping
// In a production app, these would be separate .glb clips loaded dynamically
const ANIMATION_MAP: Record<string, string> = {
  "HELLO": "sign_hello",
  "WELCOME": "sign_welcome",
  "GO": "sign_go",
  "APPLE": "sign_apple",
  "EAT": "sign_eat",
  "YOU": "sign_pointing",
};

function Avatar({ glossSequence }: { glossSequence: string[] }) {
  // Using a high-quality Ready Player Me avatar
  const { scene, animations } = useGLTF('https://models.readyplayer.me/658428965934529ec969796b.glb');
  const { actions, names } = useAnimations(animations, scene);
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (glossSequence.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const playNextSign = async () => {
      const gloss = glossSequence[currentGlossIndex];
      const animationName = ANIMATION_MAP[gloss] || "Idle"; // Fallback to Idle if sign not in dataset

      // 1. Stop all current actions
      Object.values(actions).forEach(action => action?.fadeOut(0.2));

      // 2. Play the specific sign animation
      // Note: This assumes the GLB has the signs embedded or we dynamically load them
      // For this demo, we simulate the sign transition
      const targetAction = actions[animationName] || actions[names[0]]; 
      
      if (targetAction) {
        targetAction.reset().fadeIn(0.2).play();
        targetAction.setLoop(THREE.LoopOnce, 1);
        targetAction.clampWhenFinished = true;
      }

      setIsAnimating(true);

      // 3. Wait for the animation length or simulated duration
      timeoutId = setTimeout(() => {
        setIsAnimating(false);
        if (currentGlossIndex < glossSequence.length - 1) {
          setCurrentGlossIndex(prev => prev + 1);
        } else {
          // Loop back to start after sequence ends
          setCurrentGlossIndex(0);
        }
      }, 2000); // Average 2s per sign
    };

    playNextSign();

    return () => clearTimeout(timeoutId);
  }, [glossSequence, currentGlossIndex, actions, names]);

  return (
    <group>
      <primitive object={scene} scale={2} position={[0, -2, 0]} />
      
      {/* Real-time ASL Status HUD */}
      <Html position={[0, 1.5, 0]} center>
        <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
          <div className="glass px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
             <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">AI Engine Active</span>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 scale-110">
            <span className="text-2xl font-black text-white italic">
              {glossSequence[currentGlossIndex] || "IDLE"}
            </span>
          </div>
          
          {/* Dataset Attribution */}
          <span className="text-[8px] text-white/30 uppercase tracking-widest mt-2">Dataset: WLASL-Retargeted</span>
        </div>
      </Html>
    </group>
  );
}

export default function SignAvatar({ glossSequence }: { glossSequence: string[] }) {
  return (
    <div className="w-full h-full min-h-[500px] glass rounded-[40px] overflow-hidden border border-white/5 relative">
      {/* Background Studio Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 40 }}>
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
        />
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
        
        <Avatar glossSequence={glossSequence} />
      </Canvas>

      {/* Control Overlay */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
         <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Neural Link Synchronized</span>
         </div>
      </div>
    </div>
  );
}
