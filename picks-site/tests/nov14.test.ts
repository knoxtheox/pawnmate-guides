import { describe, expect, it } from "vitest";
import { CFB_V1, project, makePicks } from "@/engine";
import { checkNov14 } from "@/engine/nov14";
import { NOV14_GAMES, NOV14_INPUTS, NOV14_PICKS } from "@/engine/fixtures/nov14";

const checks = checkNov14(CFB_V1);
const byRow = (row: number) => checks.find((c) => c.pick.row === row)!;
const record = (rows: typeof checks) => {
  const w = rows.filter((c) => c.engineGrade === "W").length;
  const l = rows.filter((c) => c.engineGrade === "L").length;
  return `${w}-${l}`;
};

describe("Nov 14 log: transcription", () => {
  it("has 16 picks across 7 games", () => {
    expect(NOV14_PICKS).toHaveLength(16);
    expect(NOV14_GAMES).toHaveLength(7);
  });
  it("logged projected scores agree with the logged totals (within rounding)", () => {
    for (const g of NOV14_GAMES) expect(Math.abs(g.projected.home + g.projected.away - g.projectedTotal)).toBeLessThanOrEqual(1);
  });
});

describe("Nov 14 log: engine reproduces the logged numbers", () => {
  it("win % from the logged margin, Φ(M/14), lands within 2.5 points of the logged Model %", () => {
    const ml = checks.filter((c) => c.pick.market === "ml");
    expect(ml).toHaveLength(7);
    for (const c of ml) expect(Math.abs(c.probability! - c.pick.modelPct!), c.pick.pickText).toBeLessThanOrEqual(0.025);
    // Kentucky by 5 → 64%, exactly as logged.
    expect(byRow(5).probability).toBeCloseTo(0.64, 2);
  });

  it("picks the same side the log picked in every pregame market", () => {
    for (const c of checks.filter((c) => c.pick.side !== "pass" && !c.pick.live)) {
      expect(c.engineSide, c.pick.pickText).toBe(c.pick.side);
    }
  });

  it("projected score = (T ± M)/2 matches the logged scores within rounding", () => {
    for (const g of NOV14_GAMES) {
      const m = g.projected.home - g.projected.away;
      expect(Math.abs((g.projectedTotal + m) / 2 - g.projected.home)).toBeLessThanOrEqual(0.75);
      expect(Math.abs((g.projectedTotal - m) / 2 - g.projected.away)).toBeLessThanOrEqual(0.75);
    }
  });

  it("grades every pick the same as the log", () => {
    for (const c of checks) expect(c.engineGrade, c.pick.pickText).toBe(c.pick.result);
  });

  it("reproduces the records: 4-3 winners, 2-1 spreads, 4-1 totals", () => {
    expect(record(checks.filter((c) => c.pick.market === "ml"))).toBe("4-3");
    expect(record(checks.filter((c) => c.pick.market === "spread"))).toBe("2-1");
    expect(record(checks.filter((c) => c.pick.market === "total"))).toBe("4-1");
  });

  it("Solid tier (60-69%) went 1-2 on winners", () => {
    const solid = checks.filter((c) => c.pick.market === "ml" && c.tier === "solid");
    expect(solid.map((c) => c.pick.pickText).sort()).toEqual(["Kentucky", "LSU", "Utah"]);
    expect(record(solid)).toBe("1-2");
  });

  it("tiers", () => {
    expect(byRow(2).tier).toBe("strong"); // Boise 74%
    expect(byRow(7).tier).toBe("lock"); // Iowa 91%
    expect(byRow(16).tier).toBe("lean"); // Texas Tech 56%
    expect(byRow(3).tier).toBe("strong"); // Oregon St +16.5, 70%
    expect(byRow(12).tier).toBeNull(); // TX-LSU over 47.5 at 51.5%: below Lean
  });

  it("value against the logged FanDuel prices", () => {
    // Kentucky 64% at −142: break-even 58.7%, edge +5.3, value.
    expect(byRow(5).value).toMatchObject({ isValue: true });
    expect(byRow(5).value!.edge).toBeCloseTo(0.053, 2);
    // Iowa 91% at −1050: break-even 91.3%, no edge.
    expect(byRow(7).value!.isValue).toBe(false);
    // Texas Tech 56% at +142: break-even 41.3%, edge +14.4.
    expect(byRow(16).value!.edge).toBeCloseTo(0.144, 2);
    expect(byRow(16).value!.isValue).toBe(true);
    // Iowa −17.5 at −110: 54.3% vs 52.4%, edge under 3, not value.
    expect(byRow(8).value!.isValue).toBe(false);
  });
});

// Full reconstruction: margin and total from the raw inputs. Switches on once
// NOV14_INPUTS is filled in with the real week-11 numbers.
const withInputs = NOV14_GAMES.filter((g) => NOV14_INPUTS[g.key]);
describe.skipIf(withInputs.length === 0)("Nov 14 log: full projection from inputs", () => {
  it.each(withInputs.map((g) => [g.key, g] as const))("%s lands near the logged projection", (_k, g) => {
    const pr = project(NOV14_INPUTS[g.key]!, CFB_V1);
    expect(Math.abs(pr.margin - (g.projected.home - g.projected.away))).toBeLessThanOrEqual(2);
    if (Number.isFinite(pr.total)) expect(Math.abs(pr.total - g.projectedTotal)).toBeLessThanOrEqual(3);
    expect(makePicks(pr, {}, CFB_V1)[0].side).toBe(g.projected.home >= g.projected.away ? "home" : "away");
  });
});
