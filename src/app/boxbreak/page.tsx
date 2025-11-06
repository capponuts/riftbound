"use client";
import BoosterScene from "./BoosterScene";

export default function BoxBreakPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-black">
      <main className="mx-auto max-w-5xl space-y-5 px-3 py-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="runeterra-title text-lg font-semibold text-amber-200">Box Break</h1>
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-md border border-zinc-700/60 px-3 py-2 text-zinc-300 hover:bg-zinc-800">🏠 Home</a>
            <a href="/admin" className="rounded-md border border-zinc-700/60 px-3 py-2 text-zinc-300 hover:bg-zinc-800">🔒 Admin</a>
          </div>
        </div>
        <p className="text-sm text-zinc-400">Simulateur d'ouverture de booster (prototype 3D).</p>
        <BoosterScene />
      </main>
    </div>
  );
}
