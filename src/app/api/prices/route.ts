import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs";

// Cache simple en mémoire (re-défini à chaud à chaque lambda)
let lastAt = 0;
let lastData: Record<string, number> = {};

function parseEuro(input: string): number | null {
  const m = input.replace(/\s/g, "").match(/([\d.,]+)\s*€?/);
  if (!m) return null;
  const raw = m[1];
  const normalized = raw.includes(",") && raw.includes(".")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(",", ".");
  const v = Number.parseFloat(normalized);
  return Number.isFinite(v) ? v : null;
}

async function fetchPage(site: number): Promise<string> {
  const url = `https://www.cardmarket.com/en/Riftbound/Products/Singles/Origins?searchMode=v1&idCategory=1655&idExpansion=6286&idRarity=0&sortBy=collectorsnumber_desc&site=${site}`;
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetch ${site} ${res.status}`);
  return await res.text();
}

function extractPrices(html: string): Array<{ code: string; price: number }> {
  const out: Array<{ code: string; price: number }> = [];
  const $ = cheerio.load(html);
  // Heuristique: chaque ligne produit
  $("tbody tr, article, .table-body-row, .product-list-item").each((_, el) => {
    const text = $(el).text();
    const codeMatch = text.match(/OG[NS]-\d+[a-z]?/i);
    if (!codeMatch) return;
    const fromMatch =
      text.match(/From\s*([\d.,]+\s*€)/i) ||
      text.match(/Starting from\s*([\d.,]+\s*€)/i) ||
      text.match(/([\d.,]+\s*€)\s*from/i);
    if (!fromMatch) return;
    const price = parseEuro(fromMatch[1]);
    if (price == null) return;
    out.push({ code: codeMatch[0].toUpperCase(), price });
  });
  // Fallback: recherche globale par blocs
  if (out.length === 0) {
    const regex = /(OG[NS]-\d+[a-z]?)[\\s\\S]{0,400}?(?:From|Starting from)\\s*([\\d.,]+\\s*€)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      const price = parseEuro(m[2]);
      if (price != null) out.push({ code: m[1].toUpperCase(), price });
    }
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const now = Date.now();
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    // TTL 2h par défaut
    if (!force && lastAt && now - lastAt < 2 * 60 * 60 * 1000 && lastData && Object.keys(lastData).length) {
      return NextResponse.json({ ok: true, prices: lastData, cached: true });
    }
    const pages = Array.from({ length: 10 }, (_, i) => i + 1);
    const htmls = await Promise.allSettled(pages.map(fetchPage));
    const map: Record<string, number> = {};
    for (const r of htmls) {
      if (r.status !== "fulfilled") continue;
      const rows = extractPrices(r.value);
      for (const { code, price } of rows) {
        // garder le prix le plus bas observé
        if (map[code] == null || price < map[code]) map[code] = price;
      }
    }
    lastAt = now;
    lastData = map;
    return NextResponse.json({ ok: true, prices: map, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}


