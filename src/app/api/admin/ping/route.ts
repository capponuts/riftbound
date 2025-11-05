import { NextResponse } from "next/server";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const used = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";
    await ensureSchema();
    const now = await query<{ now: string }>("select now()::text as now");
    const count = await query<{ c: string }>("select count(*)::text as c from collection");
    const redacted = used.replace(/:\/\/[A-Za-z0-9_]+:([^@]+)@/, "://***:***@");
    return NextResponse.json({ ok: true, now: now.rows[0]?.now, rows: Number(count.rows[0]?.c ?? 0), connection: redacted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}


