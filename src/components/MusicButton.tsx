"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Particle = {
  id: number;
  start: number;
  durationMs: number;
  angle: number;
  distance: number;
  size: number;
};

export default function MusicButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  // Préparer l'audio à la première interaction utilisateur
  useEffect(() => {
    if (!audioRef.current) {
      const el = new Audio("/music.mp3");
      el.loop = true;
      el.preload = "auto";
      el.volume = 0.6;
      audioRef.current = el;
    }
  }, []);

  // Nettoyage des particules expirées
  useEffect(() => {
    if (particles.length === 0) return;
    const t = window.setInterval(() => {
      const now = performance.now();
      setParticles((p) => p.filter((x) => now - x.start < x.durationMs));
    }, 150);
    return () => window.clearInterval(t);
  }, [particles.length]);

  const spawnParticles = useCallback((count: number) => {
    const now = performance.now();
    const next: Particle[] = [];
    for (let i = 0; i < count; i++) {
      next.push({
        id: idRef.current++,
        start: now,
        durationMs: 1200 + Math.random() * 600,
        angle: Math.random() * Math.PI * 2,
        distance: 40 + Math.random() * 80,
        size: 10 + Math.random() * 10,
      });
    }
    setParticles((p) => [...p, ...next]);
  }, []);

  const toggle = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (!playing) {
        await el.play();
        setPlaying(true);
        spawnParticles(10);
      } else {
        el.pause();
        setPlaying(false);
        spawnParticles(6);
      }
    } catch {
      // silence
    }
  }, [playing, spawnParticles]);

  const ringClasses = useMemo(
    () =>
      "pointer-events-none absolute inset-0 rounded-full border border-amber-400/30",
    []
  );

  return (
    <>
      {/* Particules (favicons) */}
      <div className="pointer-events-none fixed bottom-20 right-6 z-[60]">
        {particles.map((p) => {
          const progress = Math.min(1, (performance.now() - p.start) / p.durationMs);
          const x = Math.cos(p.angle) * p.distance * progress;
          const y = Math.sin(p.angle) * p.distance * progress * -1; // monter
          const scale = 1 + 0.5 * (1 - progress);
          const opacity = 1 - progress;
          return (
            <img
              key={p.id}
              src="/favicon.ico"
              alt=""
              style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                width: p.size,
                height: p.size,
                opacity,
                transition: "transform 80ms linear, opacity 120ms linear",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
              }}
            />
          );
        })}
      </div>

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play music"}
        className="fixed bottom-6 right-6 z-[61] flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-900 text-amber-300 shadow-lg shadow-black/40 outline-none transition hover:scale-105 active:scale-95"
        style={{
          boxShadow: playing ? "0 0 0 2px rgba(245,158,11,0.25)" : undefined,
        }}
      >
        {/* Icône musique simple (SVG inline) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3v10.55A4 4 0 1 1 10 9V6h10V3h-8z" />
        </svg>

        {/* Ondes animées quand playing */}
        {playing && (
          <>
            <span className={`${ringClasses} animate-ping`} />
            <span className={`${ringClasses}`} style={{ animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
          </>
        )}
      </button>
    </>
  );
}


