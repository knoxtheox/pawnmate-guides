/**
 * Every number the game model uses. A model version stores one of these as JSON;
 * Training proposes changes to it and Settings can roll back to an earlier one.
 */
export type GameModelParams = {
  sport: "cfb" | "nfl";
  /** M = w.ratings·R + w.independent·I + w.stat·S + HFA + Inj + H2H */
  weights: { ratings: number; independent: number; stat: number };
  /** If a component is missing for a game, spread its weight over the ones present. */
  renormalizeMissing: boolean;
  /** Home field in points; 0 at a neutral site. */
  hfa: number;
  sigmaMargin: number;
  sigmaTotal: number;
  /** Confidence scale k in P = Φ(k·M/σ). 1 = as specified. */
  k: number;
  /** Points added to every projected total (Training's "total bias offset"). */
  totalBias: number;
  injuries: {
    /** Starting QB out: penalty runs from qbOutMin (good backup) to qbOutMax (poor backup). */
    qbOutMin: number;
    qbOutMax: number;
    /** Other starters: each costs starterMin..starterMax by importance, capped per team. */
    starterMin: number;
    starterMax: number;
    starterCap: number;
  };
  h2h: {
    /** Largest series-history adjustment, in points. */
    maxPts: number;
    /** Points of adjustment per point of average qualifying margin, before the cap. */
    scale: number;
  };
  /** Lower edge of each tier, on the side's win/cover probability. Below lean = no tier. */
  tiers: { lean: number; solid: number; strong: number; lock: number };
  value: { minEdge: number; minEv: number };
  /** Flag games where the ratings and independent projections disagree by more than this. */
  disagreementPts: number;
  weather: {
    windMph: number;
    /** Points added to the total when wind exceeds windMph (0 = flag only). */
    windTotalAdj: number;
    /** Points added to the total in heavy rain (0 = flag only). */
    heavyRainTotalAdj: number;
  };
  /** Points added to the total per unit of the pace index (plays above average). 0 = off. */
  paceTotalAdj: number;
};

const shared = {
  weights: { ratings: 0.5, independent: 0.35, stat: 0.15 },
  renormalizeMissing: true,
  k: 1,
  totalBias: 0,
  injuries: { qbOutMin: 3, qbOutMax: 7, starterMin: 0.5, starterMax: 1.5, starterCap: 4 },
  h2h: { maxPts: 1, scale: 0.1 },
  tiers: { lean: 0.52, solid: 0.6, strong: 0.7, lock: 0.8 },
  value: { minEdge: 0.03, minEv: 0 },
  disagreementPts: 8,
  weather: { windMph: 15, windTotalAdj: 0, heavyRainTotalAdj: 0 },
  paceTotalAdj: 0,
} satisfies Omit<GameModelParams, "sport" | "hfa" | "sigmaMargin" | "sigmaTotal">;

/** Version 1: the numbers in the build spec (Nov 15, 2026). */
export const CFB_V1: GameModelParams = { ...structuredClone(shared), sport: "cfb", hfa: 2.5, sigmaMargin: 14, sigmaTotal: 13 };
export const NFL_V1: GameModelParams = { ...structuredClone(shared), sport: "nfl", hfa: 1.5, sigmaMargin: 13.5, sigmaTotal: 10 };
