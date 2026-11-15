/**
 * Idempotent seed, run after migrations on every deploy:
 *  1. Model version 1 for CFB and NFL (the build-spec numbers), active, if the sport has no versions yet.
 *  2. The Nov 14, 2026 CFB Projection Log as season 2026 week 11 (7 games, 16 picks, results, 5 tickets),
 *     if it hasn't been imported.
 */
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../src/db/schema";
import { CFB_V1, NFL_V1 } from "../src/engine/params";
import { checkNov14 } from "../src/engine/nov14";
import { tierFor } from "../src/engine/model";
import { valueVs } from "../src/engine/odds";
import { NOV14_DATE, NOV14_GAMES, NOV14_SEASON, NOV14_TICKETS, NOV14_WEEK } from "../src/engine/fixtures/nov14";

const CENTRAL_OFFSET = "-06:00"; // CST on Nov 14, 2026

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const pool = new pg.Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool, { schema });
  const { modelVersions, games, picks, results, tickets } = schema;

  try {
    await db.transaction(async (tx) => {
      // 1. Model versions
      for (const [sport, params] of [["cfb", CFB_V1], ["nfl", NFL_V1]] as const) {
        const existing = await tx.select({ id: modelVersions.id }).from(modelVersions).where(eq(modelVersions.sport, sport)).limit(1);
        if (existing.length) continue;
        await tx.insert(modelVersions).values({
          sport, version: 1, parameters: params, isActive: true, approvedAt: new Date(),
          notes: "Version 1: numbers from the build spec (Nov 15, 2026).",
        });
        console.log(`Created ${sport.toUpperCase()} model version 1.`);
      }

      // 2. Week 11 import
      const already = await tx
        .select({ id: games.id })
        .from(games)
        .where(and(eq(games.sport, "cfb"), eq(games.season, NOV14_SEASON), eq(games.week, NOV14_WEEK)))
        .limit(1);
      if (already.length) {
        console.log("Week 11 already imported.");
        return;
      }

      const [cfbV1] = await tx.select().from(modelVersions).where(and(eq(modelVersions.sport, "cfb"), eq(modelVersions.version, 1)));
      const gameIds = new Map<string, number>();
      for (const g of NOV14_GAMES) {
        const [row] = await tx
          .insert(games)
          .values({
            sport: "cfb", season: NOV14_SEASON, week: NOV14_WEEK,
            kickoff: new Date(`${NOV14_DATE}T12:00:00${CENTRAL_OFFSET}`), kickoffKnown: false,
            home: g.home, away: g.away, neutral: false,
            homeScore: g.final.home, awayScore: g.final.away, status: "final",
          })
          .returning({ id: games.id });
        gameIds.set(g.key, row.id);
      }

      const pickIds = new Map<number, number>();
      for (const c of checkNov14(cfbV1.parameters as typeof CFB_V1)) {
        const p = c.pick;
        // ML picks keep the logged Model %; spread/total probabilities weren't logged,
        // so they come from the engine applied to the logged projection.
        // Live picks were in-game reads, not model output, so they carry no model probability.
        const probability = p.side === "pass" || p.live ? null : (p.modelPct ?? c.probability);
        const value = probability != null && p.fdOdds != null ? valueVs(probability, p.fdOdds, CFB_V1.value) : null;
        const tier = probability != null ? tierFor(probability, CFB_V1.tiers) : null;
        const [row] = await tx
          .insert(picks)
          .values({
            gameId: gameIds.get(p.game)!, modelVersionId: cfbV1.id, market: p.market,
            projectedMargin: c.margin, projectedTotal: c.total,
            projectedHome: c.game.projected.home, projectedAway: c.game.projected.away,
            probability, tier, pickSide: p.side, pickText: p.pickText, pickLine: p.line,
            oddsUsed: p.fdOdds, breakEven: value?.breakEven, edge: value?.edge, ev: value?.ev,
            isValue: value?.isValue ?? false,
            inputSnapshots: {
              source: "CFB Projection Log", sheetRow: p.row,
              probabilitySource:
                probability == null ? null : p.modelPct != null ? "logged" : "engine-from-logged-projection",
              engineProbability: c.probability,
            },
            source: "import", live: p.live, notes: p.notes,
            createdAt: new Date(`${NOV14_DATE}T12:00:00${CENTRAL_OFFSET}`),
          })
          .returning({ id: picks.id });
        pickIds.set(p.row, row.id);

        if (p.result) {
          const g = c.game;
          await tx.insert(results).values({
            pickId: row.id, result: p.result,
            // Signed misses, actual − projected (home − away for margin).
            marginMiss: (g.final.home - g.final.away) - c.margin,
            totalMiss: (g.final.home + g.final.away) - c.total,
            gradedAt: new Date(`2026-11-15T09:00:00${CENTRAL_OFFSET}`),
          });
        }
      }

      for (const t of NOV14_TICKETS) {
        await tx.insert(tickets).values({
          placedAt: new Date(t.placedAtLocal + CENTRAL_OFFSET), description: t.description,
          legs: t.legs.map((l) => ({ text: l.text, pickId: l.pickRow ? pickIds.get(l.pickRow) : undefined })),
          odds: t.odds, stake: t.stake, result: t.result, return: t.return, notes: t.decidedBy,
        });
      }
      console.log(`Imported week 11: ${NOV14_GAMES.length} games, ${pickIds.size} picks, ${NOV14_TICKETS.length} tickets.`);
    });
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
