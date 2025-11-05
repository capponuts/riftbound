"use client";

import type { CardEntry } from "@/types";
import { estimateCardValue } from "@/lib/pricing";

export interface CollectionTableProps {
  cards: CardEntry[];
  onUpdate: (entry: CardEntry) => void;
  onRemove: (id: string) => void;
}

export default function CollectionTable({ cards, onUpdate, onRemove }: CollectionTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950">
      <table className="min-w-full text-sm">
        <thead className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-zinc-200">
          <tr>
            <th className="px-4 py-3 text-left">Nom</th>
            <th className="px-4 py-3 text-left">Rareté</th>
            <th className="px-4 py-3 text-left">Foil</th>
            <th className="px-4 py-3 text-right">Quantité</th>
            <th className="px-4 py-3 text-right">Valeur estimée</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cards.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                Aucune carte pour le moment.
              </td>
            </tr>
          ) : (
            cards.map((c) => (
              <tr key={c.id} className="border-t border-zinc-800/60 text-zinc-100">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.rarity}</td>
                <td className="px-4 py-2">{c.isFoil ? "Oui" : "Non"}</td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    className="w-24 rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-1 text-right"
                    value={c.quantity}
                    onChange={(e) => onUpdate({ ...c, quantity: Number(e.target.value) })}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  {estimateCardValue(c).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    className="rounded-md border border-red-500/60 px-3 py-1 text-red-300 hover:bg-red-500/10"
                    onClick={() => onRemove(c.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


