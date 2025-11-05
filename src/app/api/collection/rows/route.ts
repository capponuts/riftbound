import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await ensureSchema();
    const { rows } = await query<{ name: string; number: string; owned: boolean; duplicate: boolean; foil: boolean }>(
      "select name, coalesce(number,'') as number, owned, duplicate, foil from collection order by name asc, number asc"
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


