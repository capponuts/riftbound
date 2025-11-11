import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "public", "liste.txt");
    const raw = await fs.readFile(p, "utf-8");
    const lines = raw.split(/\r?\n/);
    const out: Array<{ name: string; number?: string }> = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;
      const number = parts[0]?.trim();
      const name = parts[1]?.trim();
      if (!name) continue;
      out.push({ name, number });
    }
    return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


