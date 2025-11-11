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

function extractPrices(html: string): Array<{ code?: string; num?: string; price: number }> {
  const out: Array<{ code?: string; num?: string; price: number }> = [];
  const $ = cheerio.load(html);
  // Heuristique: chaque ligne produit
  $("tbody tr, article, .table-body-row, .product-list-item").each((_, el) => {
    const text = $(el).text();
    const codeMatch = text.match(/OG[NS]-\d+[a-z]?/i);
    const numMatch =
      text.match(/(\d{1,3}[a-z]?)\s*\/\s*\d{2,3}/i) || // 310/298
      text.match(/\bNo\.?\s*([0-9]{1,3}[a-z]?)/i) ||
      text.match(/\b#\s*([0-9]{1,3}[a-z]?)/i);
    const fromMatch =
      text.match(/From\s*([\d.,]+\s*€)/i) ||
      text.match(/Starting from\s*([\d.,]+\s*€)/i) ||
      text.match(/([\d.,]+\s*€)\s*from/i);
    if (!fromMatch) return;
    const price = parseEuro(fromMatch[1]);
    if (price == null) return;
    out.push({ code: codeMatch ? codeMatch[0].toUpperCase() : undefined, num: numMatch ? numMatch[1].toUpperCase() : undefined, price });
  });
  // Fallback: recherche globale par blocs
  if (out.length === 0) {
    const regex = /(OG[NS]-\d+[a-z]?)|(\b[0-9]{1,3}[a-z]?\s*\/\s*[0-9]{2,3})[\s\S]{0,400}?(?:From|Starting from)\s*([\d.,]+\s*€)/gi;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(html)) !== null) {
      const code = m[1] ? m[1].toUpperCase() : undefined;
      const numOnly = m[2] ? (m[2].split("/")[0] || "").trim().toUpperCase() : undefined;
      const price = parseEuro(m[3] || "");
      if (price != null) out.push({ code, num: numOnly, price });
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
      for (const { code, num, price } of rows) {
        // garder le prix le plus bas observé
        if (code) {
          if (map[code] == null || price < map[code]) map[code] = price;
        }
        if (num) {
          const n = num.replace(/\s+/g, "");
          if (map[n] == null || price < map[n]) map[n] = price; // clé numérique seule (ex: 310)
          // Clé OGN-<num> par défaut pour cette page Origins
          const ognKey = `OGN-${n}`;
          if (map[ognKey] == null || price < map[ognKey]) map[ognKey] = price;
        }
      }
    }
    lastAt = now;
    lastData = map;
    return NextResponse.json({ ok: true, prices: map, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}


