function slugifyCardName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function candidateImageUrls(name: string): string[] {
  const slug = slugifyCardName(name);
  // Fallback local uniquement: les fichiers peuvent être pré-téléchargés dans public/cards
  return [`/cards/${slug}.webp`];
}

export function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}


