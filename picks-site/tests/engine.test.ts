import { describe, expect, it } from "vitest";
import {
  CFB_V1,
  NFL_V1,
  breakEven,
  coverProbability,
  decimalOdds,
  expectedValue,
  grade,
  h2hAdjustment,
  injuryPenalty,
  makePicks,
  overProbability,
  parseAmerican,
  phi,
  project,
  statMargin,
  tierFor,
  valueVs,
  winProbability,
  type GameInputs,
} from "@/engine";

const P = CFB_V1;

describe("normal curve Φ", () => {
  it.each([
    [0, 0.5],
    [1, 0.8413447],
    [-1, 0.1586553],
    [1.96, 0.9750021],
    [-2.5, 0.0062097],
    [3, 0.9986501],
  ])("Φ(%f) = %f", (x, want) => {
    expect(phi(x)).toBeCloseTo(want, 7);
  });
  it("is symmetric", () => {
    for (const x of [0.1, 0.7, 1.3, 2.2]) expect(phi(x) + phi(-x)).toBeCloseTo(1, 9);
  });
});

describe("odds math", () => {
  it("break-even: 100/(X+100) for +X, X/(X+100) for −X", () => {
    expect(breakEven(100)).toBeCloseTo(0.5, 9);
    expect(breakEven(150)).toBeCloseTo(100 / 250, 9);
    expect(breakEven(-110)).toBeCloseTo(110 / 210, 9);
    expect(breakEven(-1050)).toBeCloseTo(1050 / 1150, 9);
  });
  it("decimal odds", () => {
    expect(decimalOdds(142)).toBeCloseTo(2.42, 9);
    expect(decimalOdds(-110)).toBeCloseTo(1 + 100 / 110, 9);
  });
  it("EV per $1 = P×(dec−1) − (1−P)", () => {
    expect(expectedValue(0.5, 100)).toBeCloseTo(0, 9);
    expect(expectedValue(0.6, -110)).toBeCloseTo(0.6 * (100 / 110) - 0.4, 9);
    // At exactly break-even, EV is zero.
    expect(expectedValue(breakEven(-142), -142)).toBeCloseTo(0, 9);
  });
  it("value play = edge ≥ 3 points and EV > 0", () => {
    expect(valueVs(0.53, 100, P.value).isValue).toBe(true); // edge 3.0
    expect(valueVs(0.529, 100, P.value).isValue).toBe(false); // edge 2.9
    expect(valueVs(0.55, -110, P.value).isValue).toBe(false); // edge 2.6
    expect(valueVs(0.56, -110, P.value).isValue).toBe(true);
  });
  it("parses American odds", () => {
    expect(parseAmerican("+142")).toBe(142);
    expect(parseAmerican("-1050")).toBe(-1050);
    expect(parseAmerican("EVEN")).toBe(100);
    expect(parseAmerican("")).toBeNull();
    expect(parseAmerican("0")).toBeNull();
  });
});

describe("probabilities", () => {
  it("P(home wins) = Φ(M/σ), σ = 14 CFB, 13.5 NFL", () => {
    expect(winProbability(14, CFB_V1)).toBeCloseTo(phi(1), 9);
    expect(winProbability(13.5, NFL_V1)).toBeCloseTo(phi(1), 9);
    expect(winProbability(0, CFB_V1)).toBe(0.5);
  });
  it("confidence scale k multiplies M", () => {
    expect(winProbability(7, { ...P, k: 0.9 })).toBeCloseTo(phi((0.9 * 7) / 14), 9);
  });
  it("cover: Φ((M + L)/σ) with L the home line", () => {
    // Home projected by 10, laying 7: covers by 3 on average.
    expect(coverProbability(10, -7, P)).toBeCloseTo(phi(3 / 14), 9);
    // Projection equals the line → 50%.
    expect(coverProbability(7, -7, P)).toBeCloseTo(0.5, 9);
  });
  it("over: 1 − Φ((O − T)/σ_total)", () => {
    expect(overProbability(60, 60, P)).toBeCloseTo(0.5, 9);
    expect(overProbability(70, 57, P)).toBeCloseTo(1 - phi(-1), 9);
    expect(overProbability(50, 60, NFL_V1)).toBeCloseTo(1 - phi(1), 9);
  });
});

describe("tiers", () => {
  it.each([
    [0.515, null],
    [0.52, "lean"],
    [0.599, "lean"],
    [0.6, "solid"],
    [0.69, "solid"],
    [0.7, "strong"],
    [0.79, "strong"],
    [0.8, "lock"],
    [0.97, "lock"],
  ])("%f → %s", (p, t) => {
    expect(tierFor(p, P.tiers)).toBe(t);
  });
});

describe("margin formula", () => {
  const base: GameInputs = {
    neutral: false,
    ratingDiffs: [10, 6], // R = 8
    independentMargins: [4, 2], // I = 3
    stats: { home: { ppg: 35, papg: 20 }, away: { ppg: 25, papg: 27 } }, // S = (35+27)/2 − (25+20)/2 = 8.5
  };

  it("stat formula", () => {
    expect(statMargin(base.stats!)).toBe(8.5);
  });

  it("M = 0.50R + 0.35I + 0.15S + HFA", () => {
    const pr = project(base, P);
    expect(pr.components).toMatchObject({ R: 8, I: 3, S: 8.5, hfa: 2.5, inj: 0, h2h: 0 });
    expect(pr.margin).toBeCloseTo(0.5 * 8 + 0.35 * 3 + 0.15 * 8.5 + 2.5, 9);
    expect(pr.pHome).toBeCloseTo(phi(pr.margin / 14), 9);
  });

  it("no home field at a neutral site; NFL uses 1.5", () => {
    expect(project({ ...base, neutral: true }, P).margin).toBeCloseTo(0.5 * 8 + 0.35 * 3 + 0.15 * 8.5, 9);
    expect(project(base, NFL_V1).components.hfa).toBe(1.5);
  });

  it("projected total and score split", () => {
    const pr = project(base, P);
    // home pts (35+27)/2 = 31, away (25+20)/2 = 22.5
    expect(pr.total).toBeCloseTo(53.5, 9);
    expect(pr.homePts - pr.awayPts).toBeCloseTo(pr.margin, 9);
    expect(pr.homePts + pr.awayPts).toBeCloseTo(pr.total, 9);
    expect(project(base, { ...P, totalBias: 2 }).total).toBeCloseTo(55.5, 9);
  });

  it("spreads a missing component's weight over the others", () => {
    const pr = project({ ...base, independentMargins: [] }, P);
    const f = 1 / 0.65;
    expect(pr.components.weights.ratings).toBeCloseTo(0.5 * f, 9);
    expect(pr.margin).toBeCloseTo(0.5 * f * 8 + 0.15 * f * 8.5 + 2.5, 9);
    expect(pr.flags).toContain("missing-inputs");
    // Turned off, missing parts just count as zero.
    const raw = project({ ...base, independentMargins: [] }, { ...P, renormalizeMissing: false });
    expect(raw.margin).toBeCloseTo(0.5 * 8 + 0.15 * 8.5 + 2.5, 9);
  });

  it("flags disagreement between ratings and independent projections", () => {
    expect(project({ ...base, independentMargins: [-3] }, P).flags).toContain("sources-disagree-on-winner");
    expect(project({ ...base, ratingDiffs: [20], independentMargins: [5] }, P).flags).toContain("sources-disagree");
    expect(project(base, P).flags).not.toContain("sources-disagree");
  });

  it("throws with no inputs at all", () => {
    expect(() => project({ neutral: false, ratingDiffs: [], independentMargins: [] }, P)).toThrow();
  });
});

describe("injuries", () => {
  const I = P.injuries;
  it("starting QB out costs 3 to 7 by backup quality", () => {
    expect(injuryPenalty({ qbOut: true, qbBackupDrop: 0 }, I)).toBe(3);
    expect(injuryPenalty({ qbOut: true, qbBackupDrop: 1 }, I)).toBe(7);
    expect(injuryPenalty({ qbOut: true }, I)).toBe(5);
  });
  it("other starters cost 0.5 to 1.5 each, capped at 4", () => {
    expect(injuryPenalty({ starters: [0] }, I)).toBe(0.5);
    expect(injuryPenalty({ starters: [1, 1] }, I)).toBe(3);
    expect(injuryPenalty({ starters: [1, 1, 1, 1] }, I)).toBe(4);
    expect(injuryPenalty({ qbOut: true, qbBackupDrop: 1, starters: [1, 1, 1, 1] }, I)).toBe(11);
  });
  it("home injuries lower the margin, away injuries raise it", () => {
    const g: GameInputs = { neutral: true, ratingDiffs: [0], independentMargins: [0] };
    expect(project({ ...g, injuries: { home: { qbOut: true, qbBackupDrop: 1 } } }, P).margin).toBeCloseTo(-7, 9);
    expect(project({ ...g, injuries: { away: { starters: [0.5] } } }, P).margin).toBeCloseTo(1, 9);
  });
});

describe("series history", () => {
  it("ignores meetings without the same head coach AND starting QB", () => {
    expect(h2hAdjustment([{ margin: 30, sameHeadCoach: true, sameStartingQb: false }], P.h2h)).toBe(0);
    expect(h2hAdjustment([{ margin: 30, sameHeadCoach: false, sameStartingQb: true }], P.h2h)).toBe(0);
    expect(h2hAdjustment(undefined, P.h2h)).toBe(0);
  });
  it("is capped at ±1 point", () => {
    expect(h2hAdjustment([{ margin: 30, sameHeadCoach: true, sameStartingQb: true }], P.h2h)).toBe(1);
    expect(h2hAdjustment([{ margin: -30, sameHeadCoach: true, sameStartingQb: true }], P.h2h)).toBe(-1);
    expect(h2hAdjustment([{ margin: 4, sameHeadCoach: true, sameStartingQb: true }], P.h2h)).toBeCloseTo(0.4, 9);
  });
});

describe("weather", () => {
  const g: GameInputs = {
    neutral: false, ratingDiffs: [0], independentMargins: [0],
    stats: { home: { ppg: 30, papg: 20 }, away: { ppg: 30, papg: 20 } },
  };
  it("flags wind above 15 mph and heavy rain outdoors; adjusts only if set", () => {
    const pr = project({ ...g, weather: { windMph: 18, heavyRain: true } }, P);
    expect(pr.flags).toEqual(expect.arrayContaining(["wind", "heavy-rain"]));
    expect(pr.total).toBe(50);
    const adj = project({ ...g, weather: { windMph: 18 } }, { ...P, weather: { ...P.weather, windTotalAdj: -3 } });
    expect(adj.total).toBe(47);
    expect(project({ ...g, weather: { windMph: 15 } }, P).flags).not.toContain("wind");
    expect(project({ ...g, weather: { windMph: 30, indoor: true } }, P).flags).not.toContain("wind");
  });
});

describe("picks and grading", () => {
  it("picks the more likely side in each market", () => {
    const pr = project({ neutral: false, ratingDiffs: [10], independentMargins: [10], stats: { home: { ppg: 30, papg: 20 }, away: { ppg: 20, papg: 30 } } }, P);
    const picks = makePicks(pr, { mlHome: -300, mlAway: 240, spreadHome: -14.5, spreadHomePrice: -110, spreadAwayPrice: -110, total: 52.5, overPrice: -110, underPrice: -110 }, P);
    const [ml, spread, total] = picks;
    expect(ml).toMatchObject({ market: "ml", side: "home", odds: -300 });
    expect(spread).toMatchObject({ market: "spread", side: "away", line: 14.5 });
    expect(total).toMatchObject({ market: "total", side: "under", line: 52.5 });
    expect(ml.value?.breakEven).toBeCloseTo(0.75, 9);
  });

  it("grades ML, spread and total with pushes", () => {
    const f = { home: 24, away: 17 };
    expect(grade({ market: "ml", side: "home", line: null }, f)).toBe("W");
    expect(grade({ market: "ml", side: "away", line: null }, f)).toBe("L");
    expect(grade({ market: "spread", side: "home", line: -7 }, f)).toBe("P");
    expect(grade({ market: "spread", side: "home", line: -6.5 }, f)).toBe("W");
    expect(grade({ market: "spread", side: "away", line: 7.5 }, f)).toBe("W");
    expect(grade({ market: "total", side: "over", line: 41 }, f)).toBe("P");
    expect(grade({ market: "total", side: "under", line: 41.5 }, f)).toBe("W");
  });
});
