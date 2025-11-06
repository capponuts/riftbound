import { NextResponse } from "next/server";
import { getAdminPassword, signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (password !== getAdminPassword()) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  const token = signSession("admin");
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}


