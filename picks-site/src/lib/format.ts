export const pct = (p: number | null | undefined, digits = 0) => (p == null ? "–" : `${(p * 100).toFixed(digits)}%`);
export const pts = (x: number | null | undefined, digits = 1) =>
  x == null ? "–" : `${x > 0 ? "+" : ""}${x.toFixed(digits)}`;
export const american = (o: number | null | undefined) => (o == null ? "–" : o > 0 ? `+${o}` : `${o}`);
export const money = (x: number | null | undefined) => (x == null ? "–" : `$${x.toFixed(2)}`);
export const tierLabel = (t: string | null) => (t ? t[0].toUpperCase() + t.slice(1) : "–");
