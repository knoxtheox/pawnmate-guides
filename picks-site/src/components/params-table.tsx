import { CFB_V1, type GameModelParams } from "@/engine/params";

/** Flattens a parameter object into rows like "weights.ratings = 0.5". */
function flatten(obj: unknown, prefix = ""): [string, string][] {
  if (obj === null || typeof obj !== "object") return [[prefix, String(obj)]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

// Postgres jsonb doesn't keep key order, so list parameters in the order they're defined.
const ORDER = flatten(CFB_V1).map(([k]) => k);
const rank = (k: string) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length);

export function ParamsTable({ params }: { params: GameModelParams }) {
  const rows = flatten(params)
    .filter(([k]) => k !== "sport")
    .sort((a, b) => rank(a[0]) - rank(b[0]));
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="py-1.5 pr-3 font-mono text-xs text-muted">{k}</td>
            <td className="py-1.5 text-right font-mono tabular-nums">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
