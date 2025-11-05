export type Rarity =
  | "Commune"
  | "Peu Commune"
  | "Rare"
  | "Épique"
  | "Légendaire";

export interface CardEntry {
  id: string; // stable id
  name: string;
  rarity: Rarity;
  quantity: number; // total copies owned
  isFoil?: boolean; // Holo/Foil flag
}

export interface PricingTable {
  baseByRarity: Record<Rarity, number>;
  foilMultiplier: number; // multiplier for foil cards
}

export interface ImportedListItem {
  name: string;
  rarity?: Rarity;
  isFoil?: boolean;
}


