"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (res.ok) router.push("/admin");
    else setError("Mot de passe invalide");
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-center text-xl font-semibold text-amber-200">Admin</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-zinc-100"
        />
        {error && <div className="text-sm text-red-400">{error}</div>}
        <button className="rounded-md bg-amber-500 px-4 py-2 font-medium text-black hover:bg-amber-400">Se connecter</button>
      </form>
    </div>
  );
}


