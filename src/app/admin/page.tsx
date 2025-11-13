"use client";

import { useEffect, useMemo, useState } from "react";

type CardRow = { name: string; number?: string; owned: boolean; duplicate: boolean; foil: boolean };

export default function AdminPage() {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [map, setMap] = useState<Record<string, CardRow>>({});
  const [q, setQ] = useState("");
  function keyFor(r: { name: string; number?: string }) { return `${r.name}|||${r.number ?? ''}`; }
  const [setFilter, setSetFilter] = useState<"all" | "ogn" | "ogs">("all");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/collection/rows", { cache: "no-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as CardRow[];
        if (!cancelled) {
          setRows(data);
          const m: Record<string, CardRow> = {};
          for (const r of data) m[keyFor(r)] = r;
          setMap(m);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // plus de boutons techniques; tout est auto-enregistré

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = rows.filter((r) => {
      if (setFilter === "ogn") return (r.number ?? "").startsWith("OGN-");
      if (setFilter === "ogs") return (r.number ?? "").startsWith("OGS-");
      return true;
    });
    const filteredByText = s
      ? base.filter((r) => r.name.toLowerCase().includes(s) || (r.number ?? "").toLowerCase().includes(s))
      : base;
    // tri: OGN puis OGS, puis numeric asc, puis suffixes
    function parse(n?: string) {
      const t = n ?? "";
      const prefix = t.startsWith("OGS-") ? 1 : 0; // OGN (0) avant OGS (1)
      const base = t.split("/")[0];
      const star = base.includes("*") ? 1 : 0;
      const m = base.match(/^(OG[NS])-(\d+)([a-z])?/i);
      const num = m ? parseInt(m[2], 10) : 9999;
      const suffixRank = m && m[3] ? 1 : 0; // sans suffixe avant avec suffixe
      return { prefix, num, suffixRank, star };
    }
    return filteredByText.sort((a, b) => {
      const pa = parse(a.number); const pb = parse(b.number);
      return pa.prefix - pb.prefix || pa.num - pb.num || pa.suffixRank - pb.suffixRank || pa.star - pb.star || a.name.localeCompare(b.name);
    });
  }, [rows, q, setFilter]);

  async function toggle(row: { name: string; number?: string }, key: "owned" | "duplicate" | "foil", value: boolean) {
    const k = keyFor(row);
    const current = map[k] ?? { name: row.name, number: row.number, owned: false, duplicate: false, foil: false };
    const next = { ...current, number: row.number, [key]: value } as CardRow;
    // règle: si duplicate=true => owned=true
    if (key === "duplicate" && value) next.owned = true;
    setMap((m) => ({ ...m, [k]: next }));
    await fetch("/api/collection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: row.name, number: row.number, [key]: value, ...(key === "duplicate" && value ? { owned: true } : {}) }),
    });
  }

  async function exportMissingTxt() {
    try {
      setExporting(true);
      const res = await fetch("/api/missing?format=txt", { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cartes-manquantes.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silencieux pour l'instant
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="runeterra-title text-lg font-semibold text-amber-200">Admin — Collection</h1>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom/numéro)"
            className="w-64 rounded-md border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
          <select value={setFilter} onChange={(e) => setSetFilter(e.target.value as any)} className="rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-2 text-sm text-zinc-100">
            <option value="all">Tous</option>
            <option value="ogn">Set de Base (OGN)</option>
            <option value="ogs">Proving Grounds (OGS)</option>
          </select>
          <button
            onClick={exportMissingTxt}
            disabled={exporting}
            className="rounded-md border border-amber-400/40 bg-zinc-900 px-3 py-2 text-sm text-amber-200 hover:bg-zinc-800 disabled:opacity-60"
            aria-label="Exporter les cartes manquantes"
            title="Télécharger la liste des cartes non possédées"
          >
            {exporting ? "Export…" : "Exporter manquantes"}
          </button>
          <a href="/" className="rounded-md border border-zinc-700/60 px-3 py-2 text-zinc-300 hover:bg-zinc-800" aria-label="Accueil">
            🏠 Home
          </a>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-md border border-zinc-700/60 px-3 py-2 text-zinc-300 hover:bg-zinc-800">Logout</button>
          </form>
        </div>
      </div>
      <div className="mb-4 text-xs text-zinc-400">Les modifications sont enregistrées automatiquement.</div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 text-zinc-400">
              <th className="px-3 py-2 text-left">Numéro</th>
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2">✅ Possédé</th>
              <th className="px-3 py-2">x2 Double</th>
              <th className="px-3 py-2">✨ Foil</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const s = map[keyFor(r)] ?? { name: r.name, number: r.number, owned: false, duplicate: false, foil: false };
              const rowKey = keyFor(r);
              const baseId = (r.name + (r.number ?? "")).replace(/[^a-zA-Z0-9]+/g, "-");
              return (
                <tr key={rowKey} className="border-b border-zinc-900/40 text-zinc-100">
                  <td className="px-3 py-2 text-zinc-400">{r.number?.split("/")[0] ?? ""}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-center">
                    <input id={`owned-${baseId}`} className="h-5 w-5 cursor-pointer align-middle" type="checkbox" checked={!!s.owned} onChange={(e) => toggle(r, "owned", e.target.checked)} />
                    <label htmlFor={`owned-${baseId}`} className="ml-1 cursor-pointer text-green-400">✅</label>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input id={`dup-${baseId}`} className="h-5 w-5 cursor-pointer align-middle" type="checkbox" checked={!!s.duplicate} onChange={(e) => toggle(r, "duplicate", e.target.checked)} />
                    <label htmlFor={`dup-${baseId}`} className="ml-1 cursor-pointer text-amber-200">x2</label>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input id={`foil-${baseId}`} className="h-5 w-5 cursor-pointer align-middle" type="checkbox" checked={!!s.foil} onChange={(e) => toggle(r, "foil", e.target.checked)} />
                    <label htmlFor={`foil-${baseId}`} className="ml-1 cursor-pointer">✨</label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


