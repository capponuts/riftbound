"use client";

import { useEffect, useMemo, useState } from "react";
import Binder from "@/components/Binder";

export default function Home() {

  const title = useMemo(() => "Riftbound: League of Legends TCG", []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-black">
      <main className="mx-auto max-w-none space-y-5 px-2 py-8">
        <header className="relative flex flex-col items-center gap-2 overflow-hidden">
          {/* Icônes flottantes en bannière */}
          <div className="pointer-events-none absolute inset-0 -z-0">
            {Array.from({ length: 14 }).map((_, i) => {
              const left = Math.random() * 100;
              const size = 14 + Math.random() * 12;
              const dur = 6 + Math.random() * 6;
              const delay = Math.random() * 4;
              const translateY = 12 + Math.random() * 24;
              return (
                <img
                  key={i}
                  src="/icon.svg"
                  alt=""
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: 0,
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: 0.25,
                    animation: `floatY ${dur}s ease-in-out ${delay}s infinite alternate`,
                    transform: `translateY(${translateY}px)`,
                    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                  }}
                />
              );
            })}
          </div>
          <img src="/logo%20riftbound.png" alt="Riftbound" className="h-16 w-auto" />
          <div className="text-xs font-semibold text-amber-300/90">Origins — Set principal</div>
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <a href="/boxbreak" className="rounded-md border border-zinc-700/60 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800" aria-label="Box Break">
              🎁 Box Break
            </a>
            <a href="/admin" className="rounded-md border border-zinc-700/60 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800" aria-label="Admin">
              🔒 Admin
            </a>
          </div>
        </header>

        <Binder />
      </main>
    </div>
  );
}
