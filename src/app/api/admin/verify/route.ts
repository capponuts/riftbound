import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureSchema();
    const p = path.join(process.cwd(), "public", "liste.txt");
    const raw = await fs.readFile(p, "utf-8");
    const lines = raw.split(/\r?\n/);
    const listNames: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;
      const name = parts[1]?.trim();
      if (!name) continue;
      listNames.push(name);
    }

    const { rows } = await query<{ name: string; number: string | null }>("select name, number from collection");
    const dbNames = new Set(rows.map((r) => r.name));
    const missingInDb: string[] = [];
    for (const n of listNames) if (!dbNames.has(n)) missingInDb.push(n);

    const columns = await query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name='collection' and table_schema='public'"
    );
    const required = ["name", "number", "owned", "duplicate", "foil", "updated_at"];
    const present = new Set(columns.rows.map((c) => c.column_name));
    const missingColumns = required.filter((c) => !present.has(c));

    return NextResponse.json({
      ok: missingColumns.length === 0 && missingInDb.length === 0,
      counts: { list: listNames.length, db: rows.length, missing: missingInDb.length },
      missingColumns,
      missingNames: missingInDb.slice(0, 50),
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


