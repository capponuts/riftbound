import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureSchema();
    const { rows } = await query<{ name: string; number: string | null; owned: boolean; duplicate: boolean; foil: boolean }>(
      "select name, number, owned, duplicate, foil from collection order by name asc, number asc"
    );
    const mapping: Record<string, { owned: boolean; duplicate: boolean; foil: boolean }> = {};
    for (const r of rows) {
      const key = `${r.name}|||${r.number ?? ''}`;
      mapping[key] = { owned: r.owned, duplicate: r.duplicate, foil: r.foil };
    }
    return NextResponse.json(mapping, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensureSchema();
    const body = await req.json().catch(() => ({}));
    const { name, number, owned, duplicate, foil } = body as {
      name?: string;
      number?: string;
      owned?: boolean;
      duplicate?: boolean;
      foil?: boolean;
    };
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name requis" }, { status: 400 });
    }
    const num = number ?? "";
    const existing = await query<{ owned: boolean; duplicate: boolean; foil: boolean }>(
      "select owned, duplicate, foil from collection where name=$1 and number=$2",
      [name, num]
    );
    const current = existing.rows[0] ?? { owned: false, duplicate: false, foil: false };
    let nextOwned = typeof owned === "boolean" ? owned : current.owned;
    const nextDuplicate = typeof duplicate === "boolean" ? duplicate : current.duplicate;
    const nextFoil = typeof foil === "boolean" ? foil : current.foil;
    // règle métier: si duplicate = true => owned = true automatiquement
    if (nextDuplicate) nextOwned = true;

    await query(
      `insert into collection(name, number, owned, duplicate, foil) values($1,$2,$3,$4,$5)
       on conflict (name, number) do update set
         owned=$3,
         duplicate=$4,
         foil=$5,
         updated_at=now()`,
      [name, num, nextOwned, nextDuplicate, nextFoil]
    );
    return NextResponse.json({ ok: true, name, number: num, owned: nextOwned, duplicate: nextDuplicate, foil: nextFoil });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


