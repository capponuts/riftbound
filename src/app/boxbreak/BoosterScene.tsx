"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

function BoosterModel() {
  const gltf = useLoader(GLTFLoader, "/booster.glb");
  return <primitive object={gltf.scene} dispose={null} />;
}

function RotatingGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.2;
  });
  return <group ref={ref}>{children}</group>;
}

export default function BoosterScene() {
  const cameraPosition = useMemo(() => [0, 1.2, 2.2] as [number, number, number], []);
  return (
    <div className="h-[70vh] w-full rounded-lg border border-zinc-800 bg-zinc-950">
      <Canvas shadows dpr={[1, 2]} camera={{ position: cameraPosition, fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <spotLight position={[-3, 6, 3]} angle={0.3} penumbra={0.5} intensity={0.7} castShadow />

        <Suspense fallback={null}>
          <group position={[0, 0.2, 0]}>
            <RotatingGroup>
              <BoosterModel />
            </RotatingGroup>
          </group>
        </Suspense>

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      </Canvas>
    </div>
  );
}


