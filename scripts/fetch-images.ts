/*
  Script: Télécharger ou référencer les images Riftmana et générer un index
  Usage:
    - Lier uniquement (ne pas télécharger):
        npx ts-node scripts/fetch-images.ts --link-only
    - Télécharger dans public/cards (par défaut):
        npx ts-node scripts/fetch-images.ts

  Le script lit public/liste.txt (Card Number\tCard Name)
  et tente de trouver une URL .webp sur riftmana.com pour chaque carte.
*/

import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

interface CardRef { number?: string; name: string }
function normalizeNumber(num?: string): string | undefined {
  if (!num) return undefined;
  const trimmed = num.trim();
  const base = trimmed.split("/")[0] || trimmed;
  const hasStar = base.includes("*");
  const clean = base.replace(/\*/g, "");
  return hasStar ? `${clean}s` : clean;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchHead(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

function readListFile(): CardRef[] {
  const p = path.join(process.cwd(), "public", "liste.txt");
  const raw = fs.readFileSync(p, "utf-8");
  const lines = raw.split(/\r?\n/);
  const out: CardRef[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const parts = line.split(/\t/);
    if (parts.length < 2) continue;
    const number = parts[0]?.trim();
    const name = parts[1]?.trim();
    if (name) out.push({ number, name });
  }
  return out;
}

async function resolveRiftmanaWebpByRef(ref: CardRef): Promise<string | null> {
  // Chemin canonique Rift Mana basé sur le numéro de carte, ex: OGN-001
  const normalized = normalizeNumber(ref.number);
  if (normalized) {
    const byNumber = `https://riftmana.com/wp-content/uploads/Cards/${normalized}.webp`;
    if (await fetchHead(byNumber)) return byNumber;
  }
  // Fallback optionnel: tenter par nom slugifié sur Rift Mana (au cas où)
  const s = slugify(ref.name);
  const guesses = [
    `https://riftmana.com/wp-content/uploads/Cards/${s}.webp`,
  ];
  for (const u of guesses) {
    if (await fetchHead(u)) return u;
  }
  return null;
}

async function download(url: string, outPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, buf);
}

async function main() {
  const linkOnly = process.argv.includes("--link-only");
  const refs = readListFile();
  const mapping: Record<string, string> = {};

  let i = 0;
  for (const ref of refs) {
    i++;
    const img = await resolveRiftmanaWebpByRef(ref);
    if (!img) continue;
    mapping[ref.name] = img;
    if (!linkOnly) {
      const out = path.join(process.cwd(), "public", "cards", `${slugify(ref.name)}.webp`);
      try {
        await download(img, out);
      } catch {
        // ignorer les erreurs de téléchargement
      }
      await sleep(50); // petit throttle
    }
  }

  const idxPath = path.join(process.cwd(), "public", "cards", "index.json");
  await fs.promises.mkdir(path.dirname(idxPath), { recursive: true });
  await fs.promises.writeFile(idxPath, JSON.stringify(mapping, null, 2), "utf-8");
  // eslint-disable-next-line no-console
  console.log(`Images référencées: ${Object.keys(mapping).length}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


