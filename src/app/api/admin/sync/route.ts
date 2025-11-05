import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    await ensureSchema();
    const p = path.join(process.cwd(), "public", "liste.txt");
    const raw = await fs.readFile(p, "utf-8");
    const lines = raw.split(/\r?\n/);
    let total = 0;
    let upserts = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;
      const number = parts[0]?.trim();
      const name = parts[1]?.trim();
      if (!name) continue;
      total++;
      await query(
        `insert into collection(name, number) values($1,$2)
         on conflict(name, number) do update set number=excluded.number, updated_at=now()`,
        [name, number ?? ""]
      );
      upserts++;
    }
    const { rows: c } = await query<{ count: string }>("select count(*)::text as count from collection");
    return NextResponse.json({ ok: true, parsed: total, upserts, rowCount: Number(c[0]?.count ?? 0) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


