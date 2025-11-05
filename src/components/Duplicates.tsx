"use client";

import { useMemo, useRef, useState } from "react";
import type { CardEntry, ImportedListItem, Rarity } from "@/types";
import { generateId } from "@/lib/storage";

export interface DuplicatesProps {
  cards: CardEntry[];
  onMerge: (entries: CardEntry[]) => void;
}

// Accepts .csv or .txt lines like: name,rarity,isFoil,quantity
// rarity optional; isFoil: true/false/1/0/foil
function parseLine(line: string): ImportedListItem & { quantity?: number } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(",").map((p) => p.trim());
  const name = parts[0];
  if (!name) return null;
  const rarity = (parts[1] as Rarity | undefined) || undefined;
  const foilRaw = (parts[2] || "").toLowerCase();
  const isFoil = foilRaw === "true" || foilRaw === "1" || foilRaw === "foil";
  const quantity = parts[3] ? Number(parts[3]) : undefined;
  return { name, rarity, isFoil, quantity };
}

export default function Duplicates({ cards, onMerge }: DuplicatesProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [imported, setImported] = useState<CardEntry[]>([]);

  const duplicates = useMemo(() => {
    const map = new Map<string, number>();
    cards.forEach((c) => map.set(c.id, c.quantity));
    return imported.filter((e) => (map.get(e.id) || 0) > 1 || e.quantity > 1);
  }, [cards, imported]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const entries: CardEntry[] = [];
    for (const l of lines) {
      const parsed = parseLine(l);
      if (!parsed) continue;
      const rarity = (parsed.rarity || "Commune") as Rarity;
      const qty = Math.max(0, Number(parsed.quantity ?? 1));
      const id = generateId(parsed.name, rarity, parsed.isFoil);
      entries.push({ id, name: parsed.name, rarity, isFoil: parsed.isFoil, quantity: qty });
    }
    setImported(entries);
  }

  function mergeToCollection() {
    onMerge(imported);
    setImported([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-zinc-200">Importer un fichier liste</div>
          <div className="text-xs text-zinc-500">Format: nom, rareté, foil, quantité (CSV/texte)</div>
        </div>
        <input ref={inputRef} type="file" accept=".txt,.csv" onChange={handleFile} className="text-zinc-200" />
      </div>

      {duplicates.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-amber-300">Liste des doubles</div>
          <ul className="mt-2 space-y-1 text-zinc-100">
            {duplicates.map((d) => (
              <li key={d.id} className="flex justify-between border-b border-zinc-800/60 py-1">
                <span>
                  {d.name} — {d.rarity} {d.isFoil ? "(Foil)" : ""}
                </span>
                <span>x{d.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {imported.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={mergeToCollection}
            className="rounded-md bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400"
          >
            Fusionner dans la collection
          </button>
        </div>
      )}
    </div>
  );
}


