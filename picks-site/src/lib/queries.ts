import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

const { modelVersions, games, picks, results, tickets } = schema;

export async function activeModelVersions() {
  return getDb().select().from(modelVersions).where(eq(modelVersions.isActive, true)).orderBy(asc(modelVersions.sport));
}

export async function allPicks() {
  return getDb()
    .select({ pick: picks, game: games, result: results })
    .from(picks)
    .innerJoin(games, eq(games.id, picks.gameId))
    .leftJoin(results, eq(results.pickId, picks.id))
    .orderBy(desc(games.season), desc(games.week), asc(games.id), asc(picks.id));
}

export async function allTickets() {
  return getDb().select().from(tickets).orderBy(desc(tickets.placedAt));
}
