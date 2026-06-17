// "use client"
import React, { useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Mapping of gloss terms to animation clip names (must match GLB animation names)
const ANIMATION_MAP: Record<string, string> = {
  HELLO: 'sign_hello',
  WELCOME: 'sign_welcome',
  GO: 'sign_go',
  APPLE: 'sign_apple',
  EAT: 'sign_eat',
  YOU: 'sign_pointing',
};

// Avatar inner component – loads the GLB and plays animations
function Avatar({ glossSequence }: { glossSequence: string[] }) {
  // Placeholder model URL – reliable static host; replace with custom GLB later if needed
  const url = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
  const [loadError, setLoadError] = useState(false);
  const gltf: any = useLoader(GLTFLoader, url, (loader) => {
    loader.manager.onError = () => setLoadError(true);
  });

  const { scene, animations } = gltf || {};
  const { actions, names } = useAnimations(animations ?? [], scene ?? new THREE.Group());
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);

  // Play next sign whenever the gloss index changes
  useEffect(() => {
    if (!glossSequence.length) return;
    const gloss = glossSequence[currentGlossIndex];
    const animationName = ANIMATION_MAP[gloss] ?? 'Idle';

    // Fade out any currently playing actions
    Object.values(actions).forEach((action) => action?.fadeOut(0.2));
    const target = actions[animationName] || actions[names?.[0]];
    if (target) {
      target.reset().fadeIn(0.2).play();
      target.setLoop(THREE.LoopOnce, 1);
      target.clampWhenFinished = true;
    }

    const timeout = setTimeout(() => {
      if (currentGlossIndex < glossSequence.length - 1) {
        setCurrentGlossIndex(currentGlossIndex + 1);
      } else {
        setCurrentGlossIndex(0);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [glossSequence, currentGlossIndex, actions, names]);

  if (loadError) {
    return (
      <div className="text-center text-red-500">
        Failed to load avatar model.
        <button
          className="ml-4 px-2 py-1 bg-primary text-white rounded"
          onClick={() => setLoadError(false)}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <group>
      <primitive object={scene} scale={2} position={[0, -2, 0]} />
      <Html position={[0, 1.5, 0]} center>
        <div className="flex flex-col items-center gap-2 pointer-events-none select-none">
          <div className="glass px-4 py-1.5 rounded-full border border-primary/30 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              AI Engine Active
            </span>
          </div>
          <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl transition-all duration-500 scale-110">
            <span className="text-2xl font-black text-white italic">
              {glossSequence[currentGlossIndex] || 'IDLE'}
            </span>
          </div>
          <span className="text-[8px] text-white/30 uppercase tracking-wider mt-2">
            Dataset: WLASL‑Retargeted
          </span>
        </div>
      </Html>
    </group>
  );
}

// Exported component used by pages
export default function SignAvatar({ glossSequence }: { glossSequence: string[] }) {
  return (
    <div className="w-full h-full min-h-[500px] glass rounded-[40px] overflow-hidden border border-white/5 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 40 }}>
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 2} />
        <Environment preset="studio" />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
        <Avatar glossSequence={glossSequence} />
      </Canvas>
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Neural Link Synchronized
          </span>
        </div>
      </div>
    </div>
  );
}
