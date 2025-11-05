import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (password !== "bonus") return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_pass", "bonus", { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}


