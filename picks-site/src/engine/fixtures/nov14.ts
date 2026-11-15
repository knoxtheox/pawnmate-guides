/**
 * CFB Projection Log, Nov 14, 2026 (season 2026, week 11), transcribed from the
 * "Picks" and "Tickets" sheets. Home team is the second team in "Away @ Home".
 * Margins are home − away. Nothing here is estimated except where noted.
 */

export type LoggedGame = {
  key: string;
  away: string;
  home: string;
  /** Logged projected score (home, away). */
  projected: { home: number; away: number };
  /** Logged projected total where the log has one; otherwise the projected score sum. */
  projectedTotal: number;
  final: { home: number; away: number };
};

export const NOV14_DATE = "2026-11-14";
export const NOV14_SEASON = 2026;
export const NOV14_WEEK = 11;

export const NOV14_GAMES: LoggedGame[] = [
  { key: "ORST@BSU", away: "Oregon State", home: "Boise State", projected: { home: 40, away: 31 }, projectedTotal: 71, final: { home: 46, away: 41 } },
  { key: "FLA@UK", away: "Florida", home: "Kentucky", projected: { home: 25, away: 20 }, projectedTotal: 46, final: { home: 14, away: 21 } },
  { key: "PUR@IOWA", away: "Purdue", home: "Iowa", projected: { home: 34, away: 15 }, projectedTotal: 49, final: { home: 28, away: 7 } },
  { key: "UTAH@ARIZ", away: "Utah", home: "Arizona", projected: { home: 26, away: 30 }, projectedTotal: 55.5, final: { home: 39, away: 40 } },
  { key: "TEX@LSU", away: "Texas", home: "LSU", projected: { home: 26, away: 22 }, projectedTotal: 48, final: { home: 21, away: 22 } },
  { key: "SC@ARK", away: "South Carolina", home: "Arkansas", projected: { home: 22, away: 31 }, projectedTotal: 53, final: { home: 34, away: 6 } },
  { key: "TTU@OKST", away: "Texas Tech", home: "Oklahoma State", projected: { home: 37, away: 39 }, projectedTotal: 76, final: { home: 27, away: 52 } },
];

export type LoggedPick = {
  /** Row in the Picks sheet (for traceability). */
  row: number;
  game: string;
  market: "ml" | "spread" | "total";
  /** "pass" = logged as "No bet". */
  side: "home" | "away" | "over" | "under" | "pass";
  /** Spread from the picked side's view, or the total line. */
  line: number | null;
  live: boolean;
  /** Logged "Model %" (ML only in the log). */
  modelPct: number | null;
  fdOdds: number | null;
  result: "W" | "L" | null;
  pickText: string;
  notes: string | null;
};

export const NOV14_PICKS: LoggedPick[] = [
  { row: 2, game: "ORST@BSU", market: "ml", side: "home", line: null, live: false, modelPct: 0.76, fdOdds: null, result: "W", pickText: "Boise St", notes: null },
  { row: 3, game: "ORST@BSU", market: "spread", side: "away", line: 16.5, live: false, modelPct: null, fdOdds: null, result: "W", pickText: "Oregon St +16.5", notes: null },
  { row: 4, game: "ORST@BSU", market: "total", side: "over", line: 65.5, live: false, modelPct: null, fdOdds: null, result: "W", pickText: "Over 65.5", notes: "Projected total ran 16 low" },
  { row: 5, game: "FLA@UK", market: "ml", side: "home", line: null, live: false, modelPct: 0.64, fdOdds: -142, result: "L", pickText: "Kentucky", notes: "UK led 14-13 after 3; Florida went 2-for-2 on two-point tries. Killed all 4 tickets" },
  { row: 6, game: "FLA@UK", market: "total", side: "under", line: 52.5, live: false, modelPct: null, fdOdds: null, result: "W", pickText: "Under 52.5", notes: null },
  { row: 7, game: "PUR@IOWA", market: "ml", side: "home", line: null, live: false, modelPct: 0.92, fdOdds: -1050, result: "W", pickText: "Iowa", notes: null },
  { row: 8, game: "PUR@IOWA", market: "spread", side: "home", line: -17.5, live: false, modelPct: null, fdOdds: -110, result: "W", pickText: "Iowa -17.5", notes: null },
  { row: 9, game: "UTAH@ARIZ", market: "ml", side: "away", line: null, live: false, modelPct: 0.6, fdOdds: -113, result: "W", pickText: "Utah", notes: null },
  { row: 10, game: "UTAH@ARIZ", market: "total", side: "pass", line: null, live: false, modelPct: null, fdOdds: null, result: null, pickText: "No bet", notes: "Projected total ran 23.5 low" },
  { row: 11, game: "TEX@LSU", market: "ml", side: "home", line: null, live: false, modelPct: 0.6, fdOdds: null, result: "L", pickText: "LSU", notes: "Model pick only; Texas ML was on Ticket 4 (+158)" },
  { row: 12, game: "TEX@LSU", market: "total", side: "over", line: 47.5, live: false, modelPct: null, fdOdds: 100, result: "L", pickText: "Over 47.5", notes: "Projected total ran 5 high" },
  { row: 13, game: "TEX@LSU", market: "total", side: "under", line: 43.5, live: true, modelPct: null, fdOdds: -110, result: "W", pickText: "Under 43.5 (live)", notes: "Live: neither offense clean, LSU 3 INTs" },
  { row: 14, game: "SC@ARK", market: "ml", side: "away", line: null, live: false, modelPct: 0.73, fdOdds: null, result: "L", pickText: "South Carolina", notes: "Biggest miss of the night; Arkansas ML was on Ticket 3 (+235)" },
  { row: 15, game: "SC@ARK", market: "spread", side: "away", line: -7.5, live: false, modelPct: null, fdOdds: 100, result: "L", pickText: "South Carolina -7.5", notes: null },
  { row: 16, game: "TTU@OKST", market: "ml", side: "away", line: null, live: false, modelPct: 0.57, fdOdds: 142, result: "W", pickText: "Texas Tech", notes: "Pregame market had TTU ~38%" },
  { row: 17, game: "TTU@OKST", market: "total", side: "over", line: 74.5, live: false, modelPct: null, fdOdds: null, result: "W", pickText: "Over 74.5", notes: null },
];

export type LoggedTicket = {
  /** Placed time as logged (Central time). */
  placedAtLocal: string;
  description: string;
  odds: number;
  stake: number;
  result: "W" | "L";
  return: number;
  decidedBy: string;
  /** Legs: text from the log, plus the logged pick row when the leg is a logged model pick. */
  legs: { text: string; pickRow?: number }[];
};

export const NOV14_TICKETS: LoggedTicket[] = [
  {
    placedAtLocal: "2026-11-14T16:51:00",
    description: "9-leg SGP+ (ORST/O65.5, UK/U52.5, Iowa -17.5, TX-LSU O47.5, SC -7.5, TTU ML, Utah ML)",
    odds: 43262, stake: 7, result: "L", return: 0,
    decidedBy: "Lost Kentucky ML, TX-LSU Over, SC -7.5",
    legs: [
      { text: "ORST/O65.5 (SGP)", pickRow: 4 }, { text: "UK/U52.5 (SGP)", pickRow: 6 }, { text: "Iowa -17.5", pickRow: 8 },
      { text: "TX-LSU O47.5", pickRow: 12 }, { text: "SC -7.5", pickRow: 15 }, { text: "TTU ML", pickRow: 16 }, { text: "Utah ML", pickRow: 9 },
    ],
  },
  {
    placedAtLocal: "2026-11-14T17:00:00",
    description: "9-leg SGP+ (ORST/O66.5, UK/U52.5, TTU/O74.5, Iowa -17.5, TX-LSU O47.5, Utah ML)",
    odds: 38468, stake: 5, result: "L", return: 0,
    decidedBy: "Lost Kentucky ML, TX-LSU Over",
    legs: [
      { text: "ORST/O66.5 (SGP; total line differs from logged pick)" }, { text: "UK/U52.5 (SGP)", pickRow: 6 }, { text: "TTU/O74.5 (SGP)", pickRow: 17 },
      { text: "Iowa -17.5", pickRow: 8 }, { text: "TX-LSU O47.5", pickRow: 12 }, { text: "Utah ML", pickRow: 9 },
    ],
  },
  {
    placedAtLocal: "2026-11-14T17:07:00",
    description: "5-leg ML: Kentucky, Iowa, Texas, Texas Tech, Utah",
    odds: 2015, stake: 5, result: "L", return: 0,
    decidedBy: "Kentucky only; would have paid $105.75",
    legs: [
      { text: "Kentucky ML", pickRow: 5 }, { text: "Iowa ML", pickRow: 7 }, { text: "Texas ML (+158, against the model pick)" },
      { text: "Texas Tech ML", pickRow: 16 }, { text: "Utah ML", pickRow: 9 },
    ],
  },
  {
    placedAtLocal: "2026-11-14T17:08:00",
    description: "5-leg ML: Kentucky, Iowa, Arkansas, Texas Tech, Utah",
    odds: 2752, stake: 5, result: "L", return: 0,
    decidedBy: "Kentucky only; would have paid $142.60",
    legs: [
      { text: "Kentucky ML", pickRow: 5 }, { text: "Iowa ML", pickRow: 7 }, { text: "Arkansas ML (+235, against the model pick)" },
      { text: "Texas Tech ML", pickRow: 16 }, { text: "Utah ML", pickRow: 9 },
    ],
  },
  {
    placedAtLocal: "2026-11-14T20:54:00",
    description: "4-leg live: TX-LSU U43.5, Arkansas ML, Texas Tech ML, Utah ML",
    odds: 419, stake: 20, result: "W", return: 103.88,
    decidedBy: "Live reads; Utah won by 1",
    legs: [
      { text: "TX-LSU U43.5 (live)", pickRow: 13 }, { text: "Arkansas ML (live)" }, { text: "Texas Tech ML", pickRow: 16 }, { text: "Utah ML", pickRow: 9 },
    ],
  },
];

/**
 * The inputs behind each Nov 14 projection (SP+, FPI, Elo, SRS, points per game,
 * injuries). The log does not record them. Fill these in, from the Nov 14 notes or
 * from CFBD's week-11 data, and the full-reconstruction test in tests/nov14.test.ts
 * switches on automatically. Leave as null until real numbers are available.
 */
export const NOV14_INPUTS: Record<string, import("../model").GameInputs | null> = {
  "ORST@BSU": null,
  "FLA@UK": null,
  "PUR@IOWA": null,
  "UTAH@ARIZ": null,
  "TEX@LSU": null,
  "SC@ARK": null,
  "TTU@OKST": null,
};
