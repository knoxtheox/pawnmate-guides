import { phi } from "./normal";
import type { GameModelParams } from "./params";
import { valueVs, type Value } from "./odds";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const present = (xs: (number | null | undefined)[]) => xs.filter((x): x is number => typeof x === "number" && Number.isFinite(x));

// ---------------------------------------------------------------------------
// Inputs. All margins are home team minus away team, on a neutral field
// (home field is added once, as HFA, so sources must not already include it).
// ---------------------------------------------------------------------------

export type TeamStats = {
  /** Points scored per game (opponent-adjusted when available). */
  ppg: number;
  /** Points allowed per game (opponent-adjusted when available). */
  papg: number;
};

export type InjuryInput = {
  qbOut?: boolean;
  /** 0 = backup is about as good as the starter, 1 = big drop-off. Default 0.5. */
  qbBackupDrop?: number;
  /** Other starters out, each with importance 0 (minor) .. 1 (star). */
  starters?: number[];
};

export type H2HMeeting = {
  /** Margin from the current home team's view (current home points − current away points). */
  margin: number;
  sameHeadCoach: boolean;
  sameStartingQb: boolean;
};

export type GameInputs = {
  neutral: boolean;
  /** R: rating differences (home − away), e.g. [SP+ diff, FPI diff]. Averaged. */
  ratingDiffs: (number | null | undefined)[];
  /** I: independent expected margins (home − away), e.g. [Elo, SRS]. Averaged. */
  independentMargins: (number | null | undefined)[];
  /** S: stat formula inputs. */
  stats?: { home: TeamStats; away: TeamStats } | null;
  injuries?: { home?: InjuryInput; away?: InjuryInput };
  h2h?: H2HMeeting[];
  weather?: { windMph?: number; heavyRain?: boolean; indoor?: boolean };
  /** Combined pace index (e.g. plays per game above average, both teams). */
  pace?: number;
};

export type Projection = {
  margin: number;
  total: number;
  homePts: number;
  awayPts: number;
  pHome: number;
  components: {
    R: number | null;
    I: number | null;
    S: number | null;
    weights: { ratings: number; independent: number; stat: number };
    hfa: number;
    inj: number;
    h2h: number;
    totalAdj: { bias: number; pace: number; weather: number };
  };
  flags: string[];
};

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function statMargin(s: { home: TeamStats; away: TeamStats }): number {
  // (A ppg + B allowed)/2 − (B ppg + A allowed)/2
  return (s.home.ppg + s.away.papg) / 2 - (s.away.ppg + s.home.papg) / 2;
}

export function statPoints(s: { home: TeamStats; away: TeamStats }): { home: number; away: number } {
  return { home: (s.home.ppg + s.away.papg) / 2, away: (s.away.ppg + s.home.papg) / 2 };
}

/** Points lost by one team to injuries (positive number). */
export function injuryPenalty(inj: InjuryInput | undefined, p: GameModelParams["injuries"]): number {
  if (!inj) return 0;
  let pts = 0;
  if (inj.qbOut) {
    const drop = clamp(inj.qbBackupDrop ?? 0.5, 0, 1);
    pts += p.qbOutMin + (p.qbOutMax - p.qbOutMin) * drop;
  }
  const others = (inj.starters ?? []).reduce(
    (sum, imp) => sum + p.starterMin + (p.starterMax - p.starterMin) * clamp(imp, 0, 1),
    0,
  );
  return pts + Math.min(others, p.starterCap);
}

/** Series history: only meetings with the same head coach AND starting QB count. */
export function h2hAdjustment(meetings: H2HMeeting[] | undefined, p: GameModelParams["h2h"]): number {
  const q = (meetings ?? []).filter((m) => m.sameHeadCoach && m.sameStartingQb);
  if (q.length === 0) return 0;
  return clamp(p.scale * mean(q.map((m) => m.margin)), -p.maxPts, p.maxPts);
}

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

export function project(input: GameInputs, params: GameModelParams): Projection {
  const flags: string[] = [];
  const r = present(input.ratingDiffs);
  const i = present(input.independentMargins);
  const R = r.length ? mean(r) : null;
  const I = i.length ? mean(i) : null;
  const S = input.stats ? statMargin(input.stats) : null;

  let w = { ...params.weights };
  if (R === null) w.ratings = 0;
  if (I === null) w.independent = 0;
  if (S === null) w.stat = 0;
  const wSum = w.ratings + w.independent + w.stat;
  if (wSum === 0) throw new Error("No model inputs: need ratings, independent projections or stats.");
  const nominal = params.weights.ratings + params.weights.independent + params.weights.stat;
  if (params.renormalizeMissing && wSum < nominal) {
    const f = nominal / wSum;
    w = { ratings: w.ratings * f, independent: w.independent * f, stat: w.stat * f };
    flags.push("missing-inputs");
  }

  if (R !== null && I !== null) {
    if (Math.sign(R) !== Math.sign(I) && R !== 0 && I !== 0) flags.push("sources-disagree-on-winner");
    else if (Math.abs(R - I) > params.disagreementPts) flags.push("sources-disagree");
  }

  const hfa = input.neutral ? 0 : params.hfa;
  const inj =
    injuryPenalty(input.injuries?.away, params.injuries) - injuryPenalty(input.injuries?.home, params.injuries);
  if (input.injuries?.home?.qbOut || input.injuries?.away?.qbOut) flags.push("qb-out");
  const h2h = h2hAdjustment(input.h2h, params.h2h);

  const margin = w.ratings * (R ?? 0) + w.independent * (I ?? 0) + w.stat * (S ?? 0) + hfa + inj + h2h;

  // Total: each team's points from the stat formula, then pace, weather and bias.
  let weatherAdj = 0;
  const wx = input.weather;
  if (wx && !wx.indoor) {
    if ((wx.windMph ?? 0) > params.weather.windMph) {
      flags.push("wind");
      weatherAdj += params.weather.windTotalAdj;
    }
    if (wx.heavyRain) {
      flags.push("heavy-rain");
      weatherAdj += params.weather.heavyRainTotalAdj;
    }
  }
  const paceAdj = (input.pace ?? 0) * params.paceTotalAdj;
  let total = NaN;
  if (input.stats) {
    const pts = statPoints(input.stats);
    total = pts.home + pts.away + paceAdj + weatherAdj + params.totalBias;
  } else {
    flags.push("no-total");
  }

  return {
    margin,
    total,
    homePts: (total + margin) / 2,
    awayPts: (total - margin) / 2,
    pHome: winProbability(margin, params),
    components: {
      R,
      I,
      S,
      weights: w,
      hfa,
      inj,
      h2h,
      totalAdj: { bias: params.totalBias, pace: paceAdj, weather: weatherAdj },
    },
    flags,
  };
}

// ---------------------------------------------------------------------------
// Probabilities
// ---------------------------------------------------------------------------

/** P(home wins) = Φ(k·M/σ) */
export function winProbability(margin: number, p: Pick<GameModelParams, "k" | "sigmaMargin">): number {
  return phi((p.k * margin) / p.sigmaMargin);
}

/** P(home covers) with spread line L on the home team (−7 = home gives 7) = Φ(k·(M + L)/σ) */
export function coverProbability(margin: number, homeLine: number, p: Pick<GameModelParams, "k" | "sigmaMargin">): number {
  return phi((p.k * (margin + homeLine)) / p.sigmaMargin);
}

/** P(over O) = 1 − Φ((O − T)/σ_total) */
export function overProbability(total: number, line: number, p: Pick<GameModelParams, "sigmaTotal">): number {
  return 1 - phi((line - total) / p.sigmaTotal);
}

export type Tier = "lean" | "solid" | "strong" | "lock";

export function tierFor(p: number, t: GameModelParams["tiers"]): Tier | null {
  // Compare in whole-percent space rounded to 0.1 so 0.6 isn't read as 0.59999.
  const x = Math.round(p * 1000) / 1000;
  if (x >= t.lock) return "lock";
  if (x >= t.strong) return "strong";
  if (x >= t.solid) return "solid";
  if (x >= t.lean) return "lean";
  return null;
}

// ---------------------------------------------------------------------------
// Picks for each market
// ---------------------------------------------------------------------------

export type Lines = {
  mlHome?: number | null;
  mlAway?: number | null;
  /** Spread on the home team, e.g. −16.5 */
  spreadHome?: number | null;
  spreadHomePrice?: number | null;
  spreadAwayPrice?: number | null;
  total?: number | null;
  overPrice?: number | null;
  underPrice?: number | null;
};

export type MarketPick = {
  market: "ml" | "spread" | "total";
  side: "home" | "away" | "over" | "under";
  /** Line for the picked side (spread from that side's view; total line for totals). */
  line: number | null;
  probability: number;
  tier: Tier | null;
  odds: number | null;
  value: Value | null;
};

function withValue(p: number, odds: number | null | undefined, params: GameModelParams): Value | null {
  return odds == null ? null : valueVs(p, odds, params.value);
}

export function makePicks(proj: Projection, lines: Lines, params: GameModelParams): MarketPick[] {
  const out: MarketPick[] = [];

  const homeFav = proj.pHome >= 0.5;
  const pML = homeFav ? proj.pHome : 1 - proj.pHome;
  const mlOdds = homeFav ? lines.mlHome : lines.mlAway;
  out.push({
    market: "ml",
    side: homeFav ? "home" : "away",
    line: null,
    probability: pML,
    tier: tierFor(pML, params.tiers),
    odds: mlOdds ?? null,
    value: withValue(pML, mlOdds, params),
  });

  if (lines.spreadHome != null) {
    const pHomeCover = coverProbability(proj.margin, lines.spreadHome, params);
    const home = pHomeCover >= 0.5;
    const p = home ? pHomeCover : 1 - pHomeCover;
    const odds = home ? lines.spreadHomePrice : lines.spreadAwayPrice;
    out.push({
      market: "spread",
      side: home ? "home" : "away",
      line: home ? lines.spreadHome : -lines.spreadHome,
      probability: p,
      tier: tierFor(p, params.tiers),
      odds: odds ?? null,
      value: withValue(p, odds, params),
    });
  }

  if (lines.total != null && Number.isFinite(proj.total)) {
    const pOver = overProbability(proj.total, lines.total, params);
    const over = pOver >= 0.5;
    const p = over ? pOver : 1 - pOver;
    const odds = over ? lines.overPrice : lines.underPrice;
    out.push({
      market: "total",
      side: over ? "over" : "under",
      line: lines.total,
      probability: p,
      tier: tierFor(p, params.tiers),
      odds: odds ?? null,
      value: withValue(p, odds, params),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export type Final = { home: number; away: number };
export type Grade = "W" | "L" | "P";

export function grade(
  pick: { market: "ml" | "spread" | "total"; side: "home" | "away" | "over" | "under"; line: number | null },
  final: Final,
): Grade {
  const diff = final.home - final.away;
  if (pick.market === "ml") {
    if (diff === 0) return "P";
    return (pick.side === "home") === diff > 0 ? "W" : "L";
  }
  if (pick.line == null) throw new Error("Spread and total picks need a line");
  if (pick.market === "spread") {
    const sideMargin = pick.side === "home" ? diff : -diff;
    const r = sideMargin + pick.line;
    return r === 0 ? "P" : r > 0 ? "W" : "L";
  }
  const t = final.home + final.away;
  if (t === pick.line) return "P";
  return (pick.side === "over") === t > pick.line ? "W" : "L";
}
