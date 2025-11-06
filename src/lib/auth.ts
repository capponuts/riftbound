import crypto from "node:crypto";

export function getAdminPassword(): string {
  const v = process.env.ADMIN_PASSWORD || "0806"; // fallback dev
  return v;
}

function getAdminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

export function signSession(payload: string): string {
  const secret = getAdminSecret();
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token?: string | null): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto.createHmac("sha256", getAdminSecret()).update(payload).digest("hex");
  // timing-safe equal
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}


