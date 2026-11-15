import { CFB_V1, type GameModelParams } from "./params";
import { coverProbability, grade, overProbability, tierFor, winProbability, type Tier } from "./model";
import { valueVs, type Value } from "./odds";
import { NOV14_GAMES, NOV14_PICKS, type LoggedGame, type LoggedPick } from "./fixtures/nov14";

/**
 * Re-runs the engine's probability, tier, value and grading layers on each logged
 * Nov 14 pick, starting from the logged projected margin and total.
 */
export type Nov14Check = {
  pick: LoggedPick;
  game: LoggedGame;
  margin: number;
  total: number;
  /** Engine probability for the logged side (null for "No bet"). */
  probability: number | null;
  /** Side the engine would pick in this market given the logged line. */
  engineSide: LoggedPick["side"] | null;
  tier: Tier | null;
  value: Value | null;
  engineGrade: "W" | "L" | "P" | null;
};

export function checkNov14(params: GameModelParams = CFB_V1): Nov14Check[] {
  return NOV14_PICKS.map((pick) => {
    const game = NOV14_GAMES.find((g) => g.key === pick.game)!;
    const margin = game.projected.home - game.projected.away;
    const total = game.projectedTotal;
    let probability: number | null = null;
    let engineSide: Nov14Check["engineSide"] = null;

    if (pick.side !== "pass") {
      if (pick.market === "ml") {
        const pHome = winProbability(margin, params);
        engineSide = pHome >= 0.5 ? "home" : "away";
        probability = pick.side === "home" ? pHome : 1 - pHome;
      } else if (pick.market === "spread") {
        const homeLine = pick.side === "home" ? pick.line! : -pick.line!;
        const pHome = coverProbability(margin, homeLine, params);
        engineSide = pHome >= 0.5 ? "home" : "away";
        probability = pick.side === "home" ? pHome : 1 - pHome;
      } else {
        const pOver = overProbability(total, pick.line!, params);
        engineSide = pOver >= 0.5 ? "over" : "under";
        probability = pick.side === "over" ? pOver : 1 - pOver;
      }
    }

    return {
      pick,
      game,
      margin,
      total,
      probability,
      engineSide,
      tier: probability == null ? null : tierFor(probability, params.tiers),
      value: probability != null && pick.fdOdds != null ? valueVs(probability, pick.fdOdds, params.value) : null,
      engineGrade:
        pick.side === "pass"
          ? null
          : grade({ market: pick.market, side: pick.side, line: pick.line }, game.final),
    };
  });
}
