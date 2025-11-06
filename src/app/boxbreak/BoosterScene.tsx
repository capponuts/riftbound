"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState, useEffect, useCallback } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TextureLoader, SRGBColorSpace } from "three";
import * as THREE from "three";

function BoosterModel({ texture }: { texture: THREE.Texture | null }) {
  const gltf = useLoader(GLTFLoader as any, "/booster.glb") as any;
  useEffect(() => {
    if (!texture) return;
    let applied = false;
    gltf.scene.traverse((obj: any) => {
      const mesh = obj as THREE.Mesh;
      const name = (mesh.name || "").toLowerCase();
      const mat: any = (mesh as any).material;
      // Heuristiques: appliquer sur un mesh de type label/cadre/cover/front
      if (!applied && mat && (name.includes("label") || name.includes("frame") || name.includes("cover") || name.includes("front"))) {
        mat.map = texture;
        mat.needsUpdate = true;
        applied = true;
      }
    });
    // Fallback: si rien d'appliqué, on laisse la scène telle quelle (un plan externe sera rendu)
  }, [gltf, texture]);
  return <primitive object={gltf.scene} dispose={null} />;
}

function BoosterPlaneOverlay({ texture }: { texture: THREE.Texture | null }) {
  if (!texture) return null;
  return (
    <mesh position={[0, 0.42, 0.12]} rotation={[0, 0, 0]} castShadow receiveShadow>
      <planeGeometry args={[0.6, 0.9]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

export default function BoosterScene() {
  const cameraPosition = useMemo(() => [0, 1.2, 2.2] as [number, number, number], []);
  const groupRef = useRef<THREE.Group>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boosterTex = useLoader(TextureLoader, "/booster.jpg");
  boosterTex.colorSpace = SRGBColorSpace;

  const [targetRotY, setTargetRotY] = useState(0);
  const [targetRotX, setTargetRotX] = useState(0);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rotY: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = wrapperRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, rotY: targetRotY };
    setDragging(true);
  }, [targetRotY]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const next = dragStart.current.rotY + dx * 0.005;
    setTargetRotY(next);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const start = dragStart.current;
    dragStart.current = null;
    setDragging(false);
    if (start) {
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (moved < 5) {
        // click => toggle open/close
        setTargetRotX((x) => (Math.abs(x) < 0.1 ? -0.6 : 0));
      }
    }
  }, []);

  const onPointerEnter = useCallback(() => setScale(1.03), []);
  const onPointerLeave = useCallback(() => {
    setScale(1);
    setDragging(false);
    dragStart.current = null;
  }, []);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    // Lerp vers la cible
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetRotY, 1 - Math.pow(0.001, delta));
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetRotX, 1 - Math.pow(0.001, delta));
    const s = THREE.MathUtils.lerp(g.scale.x, scale, 1 - Math.pow(0.001, delta));
    g.scale.setScalar(s);
    // Petit « idle wobble » quand non drag
    if (!dragging && Math.abs(targetRotX) < 0.1) {
      g.rotation.y += Math.sin(performance.now() * 0.001) * delta * 0.05;
    }
  });

  return (
    <div ref={wrapperRef} className="h-[70vh] w-full rounded-lg border border-zinc-800 bg-zinc-950">
      <Canvas shadows dpr={[1, 2]} camera={{ position: cameraPosition, fov: 50 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <spotLight position={[-3, 6, 3]} angle={0.3} penumbra={0.5} intensity={0.7} castShadow />

        <Suspense fallback={null}>
          <group ref={groupRef} position={[0, 0.2, 0]}>
            <BoosterModel texture={boosterTex} />
            {/* Fallback visuel si le mesh-cadre n'est pas détecté */}
            <BoosterPlaneOverlay texture={boosterTex} />
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


