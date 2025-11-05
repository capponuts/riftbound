"use client";

import { useEffect, useMemo, useState } from "react";
import type { CardEntry, Rarity } from "@/types";
import { generateId } from "@/lib/storage";
import { CARD_NAMES } from "@/data/cards";

const RARITIES: Rarity[] = [
  "Commune",
  "Peu Commune",
  "Rare",
  "Épique",
  "Légendaire",
];

export interface CardFormProps {
  onAdd: (entry: CardEntry) => void;
}

export default function CardForm({ onAdd }: CardFormProps) {
  const [name, setName] = useState("");
  const [nameMode, setNameMode] = useState<"select" | "manual">("select");
  const [rarity, setRarity] = useState<Rarity>("Commune");
  const [quantity, setQuantity] = useState<number>(1);
  const [isFoil, setIsFoil] = useState<boolean>(false);
  const [loadedNames, setLoadedNames] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadList() {
      try {
        const res = await fetch("/liste.txt", { cache: "force-cache" });
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.split(/\r?\n/);
        const names: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const parts = line.split(/\t/);
          if (parts.length < 2) continue;
          const nm = parts[1].trim();
          if (nm) names.push(nm);
        }
        // dédoublonner en conservant l'ordre
        const unique: string[] = Array.from(new Set(names));
        if (!cancelled) setLoadedNames(unique);
      } catch {
        // fallback silencieux
      }
    }
    loadList();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => name.trim().length > 0 && quantity > 0, [name, quantity]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    // Normaliser le nom saisi vers l’entrée de la liste si correspondance insensible à la casse
    const normalized = (() => {
      const idx = CARD_NAMES.findIndex((n) => n.toLowerCase() === name.trim().toLowerCase());
      return idx >= 0 ? CARD_NAMES[idx] : name.trim();
    })();
    const entry: CardEntry = {
      id: generateId(normalized, rarity, isFoil),
      name: normalized,
      rarity,
      quantity,
      isFoil,
    };
    onAdd(entry);
    setQuantity(1);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-xl border border-zinc-800/60 bg-gradient-to-br from-zinc-950 to-zinc-900 p-4 shadow-[0_0_40px_-15px_rgba(0,0,0,0.8)]">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="col-span-2 flex flex-col gap-2">
          {nameMode === "select" ? (
            <select
              className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400/70"
              value={name || "__placeholder__"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__manual__") {
                  setNameMode("manual");
                  setName("");
                } else {
                  setName(v);
                }
              }}
            >
              <option value="__placeholder__" disabled>
                Sélectionner un nom de carte
              </option>
              {(loadedNames ?? CARD_NAMES).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="__manual__">Autre (saisie manuelle)</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-amber-400/70"
                placeholder="Nom de la carte"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                type="button"
                className="rounded-md border border-zinc-700/60 px-3 py-2 text-zinc-200 hover:bg-zinc-800"
                onClick={() => {
                  setNameMode("select");
                  setName("");
                }}
              >
                Liste
              </button>
            </div>
          )}
        </div>
        <select
          className="rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400/70"
          value={rarity}
          onChange={(e) => setRarity(e.target.value as Rarity)}
        >
          {RARITIES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          className="rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-amber-400/70"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
        <label className="flex items-center gap-2 text-zinc-200">
          <input type="checkbox" checked={isFoil} onChange={(e) => setIsFoil(e.target.checked)} />
          Holo/Foil
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ajouter
        </button>
      </div>
    </form>
  );
}


