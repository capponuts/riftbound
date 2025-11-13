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

export async function GET() {
	try {
		await ensureSchema();
		// Charger la liste de toutes les cartes (référentiel)
		const refs = await readAllRefs();
		// Charger les statuts actuels de collection
		const { rows } = await query<{ name: string; number: string | null; owned: boolean }>(
			"select name, number, owned from collection"
		);
		const statusMap = new Map<string, boolean>();
		for (const r of rows) {
			statusMap.set(`${r.name}|||${r.number ?? ""}`, !!r.owned);
		}
		// Filtrer celles non possédées (owned=false ou absentes)
		const missing = refs.filter((r) => !statusMap.get(keyFor(r)));
		return NextResponse.json(missing, { status: 200, headers: { "Cache-Control": "no-store" } });
	} catch (e: any) {
		return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
	}
}


