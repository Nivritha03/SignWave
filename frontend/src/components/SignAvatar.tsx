"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, useAnimations } from "@react-three/drei";
import { useAvatar } from "@/context/AvatarContext";

interface SignAvatarProps {
  glossSequence?: string[];
  avatarStyle?: "maya" | "alex";
  modelUrl?: string;
  /** If true, cycles through glossSequence automatically one-by-one */
  sequentialPlay?: boolean;
  /** Duration in ms for each gloss sign. Defaults to 2000ms */
  signDuration?: number;
}

// ----------------------------------------------------------------------------------
// Inner model component — handles AnimationMixer and sequential gloss playback
// ----------------------------------------------------------------------------------
function Model({
  glossSequence = [],
  avatarStyle,
  modelUrl,
  sequentialPlay = true,
  signDuration = 2200,
}: {
  glossSequence?: string[];
  avatarStyle?: "maya" | "alex";
  modelUrl?: string;
  sequentialPlay?: boolean;
  signDuration?: number;
}) {
  const path = modelUrl || `/models/${avatarStyle === "alex" ? "Alex" : "Maya"}.glb`;
  const gltf = useGLTF(path) as any;
  const { scene, animations } = gltf;
  const { actions, mixer } = useAnimations(animations, scene);

  const queueRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentActionRef = useRef<any>(null);

  // Play a named clip (or idle) and return the action duration in ms
  const playClip = (name: string | null) => {
    const key = name ?? "idle";
    const action = actions[key] || actions["idle"] || actions[Object.keys(actions)[0]];
    if (!action) return signDuration;

    // Fade out all others
    if (currentActionRef.current && currentActionRef.current !== action) {
      currentActionRef.current.fadeOut(0.3);
    }

    action.reset().setLoop(1, 1).clampWhenFinished = true;
    action.fadeIn(0.3).play();
    currentActionRef.current = action;

    // Use the clip's real duration if available, otherwise use signDuration
    const clipDurationMs = action.getClip
      ? (action.getClip().duration * 1000)
      : signDuration;

    return Math.max(clipDurationMs, 800);
  };

  const playIdle = () => {
    const idleAction = actions["idle"] || actions[Object.keys(actions)[0]];
    if (idleAction && idleAction !== currentActionRef.current) {
      if (currentActionRef.current) currentActionRef.current.fadeOut(0.4);
      idleAction.reset().setLoop(2200, Infinity).fadeIn(0.4).play();
      currentActionRef.current = idleAction;
    }
  };

  const scheduleNext = (queue: string[], idx: number) => {
    if (idx >= queue.length) {
      playIdle();
      return;
    }

    const gloss = queue[idx].toUpperCase();
    // Map gloss to action name — try exact, then lowercase, then idle
    const actionKey =
      actions[gloss] ? gloss :
      actions[gloss.toLowerCase()] ? gloss.toLowerCase() :
      null;

    const durationMs = playClip(actionKey);

    timerRef.current = setTimeout(() => {
      scheduleNext(queue, idx + 1);
    }, durationMs + 200); // +200ms pause between signs
  };

  // Reset and replay when glossSequence changes
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!glossSequence || glossSequence.length === 0) {
      playIdle();
      return;
    }

    queueRef.current = glossSequence;
    indexRef.current = 0;

    if (sequentialPlay) {
      scheduleNext(glossSequence, 0);
    } else {
      // Play just the first gloss (non-sequential mode)
      const gloss = glossSequence[0].toUpperCase();
      const actionKey = actions[gloss] ? gloss : actions[gloss.toLowerCase()] ? gloss.toLowerCase() : null;
      playClip(actionKey);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(glossSequence), actions]);

  // Run the mixer on every frame
  useFrame((_, delta) => {
    mixer.update(delta);
  });

  return <primitive object={scene} />;
}

// ----------------------------------------------------------------------------------
// Exported SignAvatar wrapper with Three.js Canvas
// ----------------------------------------------------------------------------------
const SignAvatar: React.FC<SignAvatarProps> = ({
  glossSequence,
  avatarStyle,
  modelUrl,
  sequentialPlay = true,
  signDuration = 2200,
}) => {
  const { style: contextStyle } = useAvatar();
  const effectiveStyle = avatarStyle ?? contextStyle;

  return (
    <div className="relative w-full h-full">
      <Canvas
        className="rounded-[2rem]"
        camera={{ position: [0, 1.5, 3], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.7} color="#a0c4ff" />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <Environment preset="sunset" background={false} />

        <Suspense fallback={null}>
          <Model
            glossSequence={glossSequence}
            avatarStyle={effectiveStyle}
            modelUrl={modelUrl}
            sequentialPlay={sequentialPlay}
            signDuration={signDuration}
          />
        </Suspense>

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
};

export default SignAvatar;
