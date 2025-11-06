"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TextureLoader, SRGBColorSpace } from "three";
import * as THREE from "three";

function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);
  const boosterTex = useLoader(TextureLoader, "/booster.jpg");
  boosterTex.colorSpace = SRGBColorSpace;
  const gltf = useLoader(GLTFLoader as any, "/booster.glb") as any;
  const baseScale = 0.45;

  // Apply texture to first matching mesh in the GLTF scene
  useEffect(() => {
    if (!boosterTex || !gltf?.scene) return;
    let applied = false;
    gltf.scene.traverse((obj: any) => {
      const mesh = obj as THREE.Mesh;
      const name = (mesh.name || "").toLowerCase();
      const mat: any = (mesh as any).material;
      if (!applied && mat && (name.includes("label") || name.includes("frame") || name.includes("cover") || name.includes("front"))) {
        mat.map = boosterTex;
        mat.needsUpdate = true;
        applied = true;
      }
    });
  }, [boosterTex, gltf]);

  const [targetRotY, setTargetRotY] = useState(0);
  const [targetRotX, setTargetRotX] = useState(0);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rotY: number } | null>(null);

  const onPointerDown = useCallback((e: any) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, rotY: targetRotY };
    setDragging(true);
  }, [targetRotY]);

  const onPointerMove = useCallback((e: any) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const next = dragStart.current.rotY + dx * 0.005;
    setTargetRotY(next);
  }, []);

  const onPointerUp = useCallback((e: any) => {
    const start = dragStart.current;
    dragStart.current = null;
    setDragging(false);
    if (start) {
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (moved < 5) {
        setTargetRotX((x) => (Math.abs(x) < 0.1 ? -0.6 : 0));
      }
    }
  }, []);

  const onPointerOver = useCallback(() => setScale(1.03), []);
  const onPointerOut = useCallback(() => {
    setScale(1);
    setDragging(false);
    dragStart.current = null;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, 1 - Math.pow(0.001, delta));
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 1 - Math.pow(0.001, delta));
    const s = THREE.MathUtils.lerp(g.scale.x / baseScale, scale, 1 - Math.pow(0.001, delta));
    g.scale.setScalar(s * baseScale);
    if (!dragging && Math.abs(targetRotX) < 0.1) {
      g.rotation.y += Math.sin(performance.now() * 0.001) * delta * 0.05;
    }
  });

  return (
    <>
      <group
        ref={groupRef}
        position={[0, 0.5, 0]}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <primitive object={gltf.scene} dispose={null} />
        {/* Fallback plane with texture in case auto-apply didn't find a target mesh */}
        <mesh position={[0, 0.30, 0.08]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[0.34, 0.55]} />
          <meshBasicMaterial map={boosterTex} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </>
  );
}

export default function BoosterScene() {
  const cameraPosition = useMemo(() => [0, 1.6, 5.2] as [number, number, number], []);
  return (
    <div className="h-[70vh] w-full rounded-lg border border-zinc-800 bg-zinc-950">
      <Canvas shadows dpr={[1, 2]} camera={{ position: cameraPosition, fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <spotLight position={[-3, 6, 3]} angle={0.3} penumbra={0.5} intensity={0.7} castShadow />

        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>

        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0b0b0b" />
        </mesh>
      </Canvas>
    </div>
  );
}


