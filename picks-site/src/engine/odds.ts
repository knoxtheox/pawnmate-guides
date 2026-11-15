/** American odds helpers. Probabilities are 0..1; edge is in probability units (0.03 = 3 points). */

export function breakEven(american: number): number {
  if (american === 0 || !Number.isFinite(american)) throw new Error(`Invalid American odds: ${american}`);
  return american > 0 ? 100 / (american + 100) : -american / (-american + 100);
}

export function decimalOdds(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}

/** EV per $1 = P × (decimal − 1) − (1 − P) */
export function expectedValue(p: number, american: number): number {
  return p * (decimalOdds(american) - 1) - (1 - p);
}

export type Value = { breakEven: number; edge: number; ev: number; isValue: boolean };

export function valueVs(p: number, american: number, rule: { minEdge: number; minEv: number }): Value {
  const be = breakEven(american);
  const edge = p - be;
  const ev = expectedValue(p, american);
  // Small epsilon so an edge of exactly 3.0 points counts despite floating-point error.
  return { breakEven: be, edge, ev, isValue: edge >= rule.minEdge - 1e-9 && ev > rule.minEv };
}

/** Parses "+142", "-110", "EVEN", 142 → number. */
export function parseAmerican(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = v.trim().toUpperCase();
  if (s === "EVEN" || s === "EV") return 100;
  const n = Number(s.replace(/^\+/, ""));
  return Number.isFinite(n) && n !== 0 ? n : null;
}
