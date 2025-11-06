function getAdminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toHex(sig);
}

export async function signSession(payload: string): Promise<string> {
  const secret = getAdminSecret();
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = await hmacSha256Hex(getAdminSecret(), payload);
  return sig === expected;
}


