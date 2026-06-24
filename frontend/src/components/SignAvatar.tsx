import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import SceneEffects from './SceneEffects';
import { useAvatar } from '@/context/AvatarContext';

// Props: glossSequence is an array of sign identifiers (placeholder for now)
// avatarStyle selects a pre‑bundled premium avatar ("maya" or "alex").
interface SignAvatarProps {
  glossSequence?: string[];
  /** "maya" (female) or "alex" (male) */
  avatarStyle?: 'maya' | 'alex';
  modelUrl?: string;
}

// Load the GLB model based on the selected style. Defaults to "maya".
function Model({ glossSequence, avatarStyle, modelUrl }: { glossSequence?: string[]; avatarStyle?: 'maya' | 'alex'; modelUrl?: string }) {
  const modelPath = modelUrl || `/models/${(avatarStyle ?? 'maya') === 'maya' ? 'Maya' : 'Alex'}.glb`;
  const gltf = useGLTF(modelPath) as any;
  const { scene, animations } = gltf;

  const currentClip = useMemo(() => {
    if (!animations || animations.length === 0) return null;
    // TODO: map glossSequence to animation clips for smooth transitions.
    return animations[0];
  }, [animations, glossSequence]);

  // Future: use AnimationMixer to play `currentClip` based on glosses.
  return <primitive object={scene} />;
}

const SignAvatar: React.FC<SignAvatarProps> = ({ glossSequence, avatarStyle, modelUrl }) => {
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
        {/* Soft ambient lighting */}
        <ambientLight intensity={0.7} color="#a0c4ff" />
        {/* Directional light with subtle shadows */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* HDRI environment for richer reflections */}
        <Environment preset="sunset" background={false} />
        <Suspense fallback={null}>
          <Model glossSequence={glossSequence} avatarStyle={effectiveStyle} modelUrl={modelUrl} />
        </Suspense>
        {/* Keep orbit controls but disable zoom/pan for a stable avatar view */}
        <OrbitControls enableZoom={false} enablePan={false} />
        {/* Visual scene effects */}
        <SceneEffects />
      </Canvas>
    </div>
  );
};

export default SignAvatar;

