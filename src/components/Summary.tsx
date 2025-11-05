"use client";

import type { CardEntry } from "@/types";
import { estimateCollectionValue } from "@/lib/pricing";

export default function Summary({ cards }: { cards: CardEntry[] }) {
  const total = estimateCollectionValue(cards);
  const totalCount = cards.reduce((s, c) => s + c.quantity, 0);
  return (
    <div className="rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-950/40 to-zinc-900 p-4 text-amber-200 shadow-[0_0_60px_-25px_rgba(255,200,50,0.5)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-300/80">Valeur estimée totale</div>
          <div className="text-2xl font-semibold text-amber-200">{total.toFixed(2)} €</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-amber-300/80">Nombre de cartes</div>
          <div className="text-xl font-medium text-amber-100">{totalCount}</div>
        </div>
      </div>
    </div>
  );
}


