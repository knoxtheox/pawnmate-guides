import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const ts = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => ts("created_at").notNull().defaultNow();
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" });

/** 'cfb' | 'nfl' */
export type Sport = "cfb" | "nfl";

// One row per game.
export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").$type<Sport>().notNull(),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    kickoff: ts("kickoff").notNull(),
    /** False when only the date is known (e.g. games imported from the log). */
    kickoffKnown: boolean("kickoff_known").notNull().default(true),
    home: text("home").notNull(),
    away: text("away").notNull(),
    neutral: boolean("neutral").notNull().default(false),
    venue: text("venue"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    /** 'scheduled' | 'in_progress' | 'final' */
    status: text("status").notNull().default("scheduled"),
    oddsApiId: text("odds_api_id"),
    cfbdId: integer("cfbd_id"),
    createdAt: createdAt(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("games_matchup_uq").on(t.sport, t.season, t.week, t.home, t.away),
    uniqueIndex("games_odds_api_uq").on(t.oddsApiId),
    index("games_week_idx").on(t.sport, t.season, t.week),
  ],
);

// One row per game × pull.
export const oddsSnapshots = pgTable(
  "odds_snapshots",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    pulledAt: ts("pulled_at").notNull(),
    book: text("book").notNull().default("fanduel"),
    mlHome: integer("ml_home"),
    mlAway: integer("ml_away"),
    /** Spread line on the home team (e.g. -7.5 = home favored by 7.5). */
    spreadHome: doublePrecision("spread_home"),
    spreadHomePrice: integer("spread_home_price"),
    spreadAwayPrice: integer("spread_away_price"),
    total: doublePrecision("total"),
    overPrice: integer("over_price"),
    underPrice: integer("under_price"),
    isClosing: boolean("is_closing").notNull().default(false),
    raw: jsonb("raw"),
  },
  (t) => [index("odds_game_idx").on(t.gameId, t.pulledAt)],
);

// One row per team × week × source.
export const teamRatings = pgTable(
  "team_ratings",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").$type<Sport>().notNull(),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    team: text("team").notNull(),
    /** 'sp+' | 'fpi' | 'elo' | 'srs' | 'epa' | 'stats' ... */
    source: text("source").notNull(),
    rating: doublePrecision("rating"),
    extra: jsonb("extra"),
    pulledAt: ts("pulled_at").notNull(),
  },
  (t) => [index("ratings_lookup_idx").on(t.sport, t.season, t.week, t.source, t.team)],
);

// One row per player × pull.
export const injuries = pgTable(
  "injuries",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").$type<Sport>().notNull(),
    team: text("team").notNull(),
    player: text("player").notNull(),
    position: text("position"),
    status: text("status").notNull(),
    isStarter: boolean("is_starter").notNull().default(false),
    source: text("source"),
    pulledAt: ts("pulled_at").notNull(),
  },
  (t) => [index("injuries_team_idx").on(t.sport, t.team, t.pulledAt)],
);

// One row per model version. parameters holds every number the model uses.
export const modelVersions = pgTable(
  "model_versions",
  {
    id: serial("id").primaryKey(),
    /** 'cfb' | 'nfl' | 'attd' */
    sport: text("sport").notNull(),
    version: integer("version").notNull(),
    parameters: jsonb("parameters").notNull(),
    parentId: integer("parent_id"),
    createdAt: createdAt(),
    approvedAt: ts("approved_at"),
    isActive: boolean("is_active").notNull().default(false),
    notes: text("notes"),
  },
  (t) => [
    uniqueIndex("model_versions_sport_version_uq").on(t.sport, t.version),
    // At most one active version per sport.
    uniqueIndex("model_versions_one_active_uq").on(t.sport).where(sql`${t.isActive}`),
  ],
);

// One row per game × market (per pipeline run).
export const picks = pgTable(
  "picks",
  {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    modelVersionId: integer("model_version_id").notNull().references(() => modelVersions.id),
    /** 'ml' | 'spread' | 'total' */
    market: text("market").notNull(),
    projectedMargin: doublePrecision("projected_margin"),
    projectedTotal: doublePrecision("projected_total"),
    projectedHome: doublePrecision("projected_home"),
    projectedAway: doublePrecision("projected_away"),
    /** Null only for a logged "No bet". */
    probability: doublePrecision("probability"),
    /** 'lean' | 'solid' | 'strong' | 'lock' | null (below lean) */
    tier: text("tier"),
    /** 'home' | 'away' | 'over' | 'under' | 'pass' */
    pickSide: text("pick_side").notNull(),
    /** Human label, e.g. "Oregon St +16.5". */
    pickText: text("pick_text"),
    pickLine: doublePrecision("pick_line"),
    oddsUsed: integer("odds_used"),
    breakEven: doublePrecision("break_even"),
    edge: doublePrecision("edge"),
    ev: doublePrecision("ev"),
    isValue: boolean("is_value").notNull().default(false),
    /** { odds: id, ratings: [...ids], injuries: pulled_at, weather: {...}, ... } */
    inputSnapshots: jsonb("input_snapshots"),
    isCurrent: boolean("is_current").notNull().default(true),
    /** 'pipeline' | 'import' | 'manual' */
    source: text("source").notNull().default("pipeline"),
    live: boolean("live").notNull().default(false),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("picks_game_idx").on(t.gameId, t.market)],
);

// One row per graded pick.
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  pickId: integer("pick_id")
    .notNull()
    .unique()
    .references(() => picks.id, { onDelete: "cascade" }),
  /** 'W' | 'L' | 'P' */
  result: text("result").notNull(),
  marginMiss: doublePrecision("margin_miss"),
  totalMiss: doublePrecision("total_miss"),
  gradedAt: ts("graded_at").notNull().defaultNow(),
});

// One row per Train click.
export const trainingRuns = pgTable("training_runs", {
  id: serial("id").primaryKey(),
  sport: text("sport").notNull(),
  runAt: ts("run_at").notNull().defaultNow(),
  gamesGraded: integer("games_graded").notNull().default(0),
  metrics: jsonb("metrics"),
  /** 'running' | 'done' | 'failed' */
  status: text("status").notNull(),
  error: text("error"),
});

// One row per proposed parameter change.
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  trainingRunId: integer("training_run_id")
    .notNull()
    .references(() => trainingRuns.id, { onDelete: "cascade" }),
  modelVersionId: integer("model_version_id").notNull().references(() => modelVersions.id),
  parameter: text("parameter").notNull(),
  currentValue: jsonb("current_value").notNull(),
  proposedValue: jsonb("proposed_value").notNull(),
  gamesUsed: integer("games_used").notNull(),
  beforeMetrics: jsonb("before_metrics"),
  afterMetrics: jsonb("after_metrics"),
  /** 'pending' | 'approved' | 'rejected' */
  status: text("status").notNull().default("pending"),
  decidedAt: ts("decided_at"),
  resultingModelVersionId: integer("resulting_model_version_id").references(() => modelVersions.id),
  createdAt: createdAt(),
});

// One row per bet placed.
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  placedAt: ts("placed_at").notNull(),
  description: text("description").notNull(),
  /** Array of pick ids (and free-text legs for picks the model didn't make). */
  legs: jsonb("legs").notNull().default(sql`'[]'::jsonb`),
  odds: integer("odds"),
  stake: money("stake").notNull(),
  /** 'W' | 'L' | 'P' | 'open' */
  result: text("result").notNull().default("open"),
  return: money("return"),
  notes: text("notes"),
  createdAt: createdAt(),
});

// ATTD: one row per player × week.
export const attdPlayers = pgTable(
  "attd_players",
  {
    id: serial("id").primaryKey(),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    gameId: integer("game_id").references(() => games.id, { onDelete: "set null" }),
    modelVersionId: integer("model_version_id").references(() => modelVersions.id),
    player: text("player").notNull(),
    team: text("team").notNull(),
    position: text("position"),
    o: doublePrecision("o"),
    u: doublePrecision("u"),
    t: doublePrecision("t"),
    d: doublePrecision("d"),
    m: doublePrecision("m"),
    r: doublePrecision("r"),
    g: doublePrecision("g"),
    s: doublePrecision("s"),
    rank: integer("rank"),
    lambda: doublePrecision("lambda"),
    p: doublePrecision("p"),
    inputs: jsonb("inputs"),
    createdAt: createdAt(),
  },
  (t) => [index("attd_players_week_idx").on(t.season, t.week)],
);

// ATTD: the logged selections. Columns finalized against the ATTD Model Log in milestone 6.
export const attdSelections = pgTable("attd_selections", {
  id: serial("id").primaryKey(),
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  attdPlayerId: integer("attd_player_id").references(() => attdPlayers.id, { onDelete: "set null" }),
  player: text("player").notNull(),
  team: text("team"),
  position: text("position"),
  opponent: text("opponent"),
  s: doublePrecision("s"),
  rank: integer("rank"),
  modelP: doublePrecision("model_p"),
  odds: integer("odds"),
  oddsPulledAt: ts("odds_pulled_at"),
  breakEven: doublePrecision("break_even"),
  edge: doublePrecision("edge"),
  ev: doublePrecision("ev"),
  stake: money("stake"),
  /** 'W' | 'L' | 'void' | 'open' */
  result: text("result").notNull().default("open"),
  notes: text("notes"),
  createdAt: createdAt(),
});
