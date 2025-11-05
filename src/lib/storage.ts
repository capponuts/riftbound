import type { CardEntry } from "@/types";

const STORAGE_KEY = "riftbound.collection";

export function loadCollection(): CardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CardEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCollection(cards: CardEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore
  }
}

export function generateId(name: string, rarity: string, isFoil?: boolean): string {
  return `${name.trim().toLowerCase()}::${rarity}::${isFoil ? "foil" : "std"}`;
}


