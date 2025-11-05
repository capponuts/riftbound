import type { CardEntry, PricingTable } from "@/types";

export const DEFAULT_PRICING: PricingTable = {
  baseByRarity: {
    Commune: 0.2,
    "Peu Commune": 0.5,
    Rare: 1.5,
    "Épique": 4,
    "Légendaire": 10,
  },
  foilMultiplier: 1.8,
};

export function estimateCardValue(
  card: Pick<CardEntry, "rarity" | "quantity" | "isFoil">,
  pricing: PricingTable = DEFAULT_PRICING
): number {
  const base = pricing.baseByRarity[card.rarity];
  const unit = card.isFoil ? base * pricing.foilMultiplier : base;
  return roundCurrency(unit * Math.max(0, card.quantity));
}

export function estimateCollectionValue(
  cards: ReadonlyArray<Pick<CardEntry, "rarity" | "quantity" | "isFoil">>,
  pricing: PricingTable = DEFAULT_PRICING
): number {
  const total = cards.reduce((sum, c) => sum + estimateCardValue(c, pricing), 0);
  return roundCurrency(total);
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}


