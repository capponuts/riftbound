import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureSchema, query } from "@/lib/db";

export const runtime = "nodejs";

type Ref = { name: string; number?: string };

function keyFor(ref: { name: string; number?: string }): string {
	return `${ref.name}|||${ref.number ?? ""}`;
}

async function readAllRefs(): Promise<Ref[]> {
	const p = path.join(process.cwd(), "public", "liste.txt");
	const raw = await fs.readFile(p, "utf-8");
	const lines = raw.split(/\r?\n/);
	const out: Ref[] = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const parts = line.split(/\t/);
		if (parts.length < 2) continue;
		const number = parts[0]?.trim();
		const name = parts[1]?.trim();
		if (!name) continue;
		out.push({ name, number });
	}
	return out;
}

export async function GET(req: Request) {
	try {
		await ensureSchema();
		const url = new URL(req.url);
		const format = url.searchParams.get("format")?.toLowerCase();
		// Charger la liste de toutes les cartes (référentiel)
		const refs = await readAllRefs();
		// Charger les statuts actuels de collection (incluant FOIL)
		const { rows } = await query<{ name: string; number: string | null; owned: boolean; foil: boolean }>(
			"select name, number, owned, foil from collection"
		);
		const statusMap = new Map<string, { owned: boolean; foil: boolean }>();
		for (const r of rows) {
			statusMap.set(`${r.name}|||${r.number ?? ""}`, { owned: !!r.owned, foil: !!r.foil });
		}
		// 1) Cartes totalement manquantes (non possédées)
		const missingStandard = refs.filter((r) => !statusMap.get(keyFor(r))?.owned);
		// 2) Cartes possédées en version normale mais manquantes en FOIL
		const missingFoil = refs.filter((r) => {
			const s = statusMap.get(keyFor(r));
			return !!s?.owned && !s.foil;
		});
		// Fusionner pour l’export, en annotant les entrées FOIL
		const combined = [
			...missingStandard.map((r) => ({ ...r, foil: false })),
			...missingFoil.map((r) => ({ ...r, foil: true })),
		];
		if (format === "txt") {
			const lines = combined
				.map((r) => {
					const base = `${(r.number ?? "").split("/")[0]} - ${r.name}`.trim();
					return r.foil ? `${base} [FOIL]` : base;
				})
				.join("\n");
			return new NextResponse(lines, {
				status: 200,
				headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
			});
		}
		return NextResponse.json(combined, { status: 200, headers: { "Cache-Control": "no-store" } });
	} catch (e: any) {
		return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
	}
}


