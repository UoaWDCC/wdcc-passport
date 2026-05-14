"use client";

import { useRef, useState } from "react";

import {
  Float,
  OrbitControls,
  PerspectiveCamera,
  useTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function WebsterCard({ imageUrl }: { imageUrl: string }) {
  const front = useTexture({
    alpha: "/cards/alpha.webp",
    map: imageUrl,
  });
  const back = useTexture({
    alpha: "/cards/alpha.webp",
    map: "/cards/backside.webp",
  });

  const size = [1.35, 1.89] as const;

  return (
    <Float speed={2}>
      <ambientLight intensity={(2 * Math.PI) / 3} />
      <group>
        <mesh>
          <planeGeometry args={size} />
          <meshStandardMaterial
            map={front.map}
            alphaMap={front.alpha}
            transparent
          />
        </mesh>
        <mesh rotation={[0, Math.PI, 0]}>
          <planeGeometry args={size} />
          <meshStandardMaterial
            map={back.map}
            alphaMap={back.alpha}
            transparent
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function InteractiveCardDisplay({
  imageUrl,
  className = "",
}: {
  imageUrl: string;
  className?: string;
}) {
  const [interacting, setInteracting] = useState(false);
  const timer = useRef<number | null>(null);

  const handleInteraction = () => {
    if (timer.current) clearTimeout(timer.current);
    setInteracting(true);
  };

  const handleEndInteraction = () => {
    timer.current = window.setTimeout(() => {
      setInteracting(false);
      timer.current = null;
    }, 1000);
  };

  return (
    <div
      className={`touch-none ${className}`}
      onMouseDown={handleInteraction}
      onMouseOut={handleEndInteraction}
      onMouseUp={handleEndInteraction}
      onTouchEnd={handleEndInteraction}
      onTouchStart={handleInteraction}
    >
      <Canvas>
        <OrbitControls
          autoRotate={!interacting}
          autoRotateSpeed={Math.PI}
          dampingFactor={0.02}
          enableZoom={false}
          minPolarAngle={Math.PI / 2 - Math.PI / 8}
          maxPolarAngle={Math.PI / 2 + Math.PI / 8}
        />
        <PerspectiveCamera makeDefault position={[0, 0, 2.45]} />
        <WebsterCard imageUrl={imageUrl} />
      </Canvas>
    </div>
  );
}
