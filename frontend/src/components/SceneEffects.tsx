import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Torus, Ring, Plane } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SceneEffects – visual embellishments for the premium SignAvatar.
 *   • Neural particles – a field of moving points that react to time.
 *   • Holographic ring – a subtle rotating ring around the avatar.
 *   • Audio waveform – a simple sine‑wave plane that could be driven by audio data.
 *   • Soft glow – achieved via emissive material on the ring.
 *
 * The component is lightweight and does not require external assets.
 * Feel free to extend it with real audio analysis (e.g., Web Audio API) later.
 */
const SceneEffects: React.FC = () => {
  // ------- Neural particles -------
  const particleCount = 2000;
  const particlesRef = useRef<THREE.Points>(null!);
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // distribute in a sphere around origin
      const radius = 2.5 + Math.random() * 0.5;
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.1;
    }
  });

  // ------- Holographic rotating ring -------
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame((_state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.3;
    }
  });

  // ------- Audio waveform (simple sine wave) -------
  const waveRef = useRef<THREE.Mesh>(null!);
  const waveSegments = 64;
  const waveGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(4, 1, waveSegments, 1);
    return geom;
  }, []);
  useFrame((_state, delta) => {
    const time = performance.now() * 0.001;
    const position = waveGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i <= waveSegments; i++) {
      const idx = i * 3; // x, y, z
      const x = (i / waveSegments) * 4 - 2; // -2 to +2
      const y = Math.sin((i / 4) + time * 2) * 0.2; // simple animation
      position.setXYZ(i, x, y, 0);
    }
    position.needsUpdate = true;
  });

  return (
    <>
      {/* Neural particles */}
      <points ref={particlesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            args={[particles, 3]}
          />
        </bufferGeometry>
        <PointMaterial
          size={0.025}
          color="#00ffdd"
          transparent
          opacity={0.7}
          sizeAttenuation={true}
        />
      </points>

      {/* Holographic ring with glow */}
      <mesh ref={ringRef} rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.2, 0.04, 16, 100]} />
        <meshStandardMaterial
          color="#00bfff"
          emissive="#00bfff"
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Audio waveform plane */}
      <mesh ref={waveRef} position={[0, -0.9, 0]} rotation-x={-Math.PI / 2}>
        <primitive object={waveGeometry} />
        <meshStandardMaterial color="#ff66aa" metalness={0.3} roughness={0.7} />
      </mesh>
    </>
  );
};

export default SceneEffects;
