import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { allPicks, allTickets } from "@/lib/queries";
import { american, money, pct, tierLabel } from "@/lib/format";

export const metadata = { title: "History" };

const resultClass = (r: string | null | undefined) =>
  r === "W" ? "text-win" : r === "L" ? "text-loss" : "text-muted";

export default async function HistoryPage() {
  const [rows, tix] = await Promise.all([allPicks(), allTickets()]);

  // Group picks by week, then by game.
  type Row = (typeof rows)[number];
  const weeks = new Map<string, Map<number, Row[]>>();
  for (const r of rows) {
    const wk = `${r.game.sport.toUpperCase()} ${r.game.season} · Week ${r.game.week}`;
    if (!weeks.has(wk)) weeks.set(wk, new Map());
    const g = weeks.get(wk)!;
    if (!g.has(r.game.id)) g.set(r.game.id, []);
    g.get(r.game.id)!.push(r);
  }

  const staked = tix.reduce((s, t) => s + t.stake, 0);
  const returned = tix.reduce((s, t) => s + (t.return ?? 0), 0);

  return (
    <>
      <PageHeader title="History">
        <Button variant="secondary" disabled>
          Add ticket
        </Button>
        <Button variant="secondary" disabled>
          Export CSV
        </Button>
      </PageHeader>

      {weeks.size === 0 && (
        <Card title="Picks">
          <Empty>No picks stored yet.</Empty>
        </Card>
      )}
      {[...weeks].map(([wk, gamesInWeek]) => {
        const graded = [...gamesInWeek.values()].flat().filter((r) => r.result);
        const w = graded.filter((r) => r.result!.result === "W").length;
        const l = graded.filter((r) => r.result!.result === "L").length;
        return (
          <Card key={wk} title={`${wk} · ${w}-${l}`}>
            <ul className="divide-y divide-line">
              {[...gamesInWeek.values()].map((gp) => {
                const g = gp[0].game;
                const first = gp[0].pick;
                return (
                  <li key={g.id} className="py-3">
                    <div className="mb-0.5 flex justify-between gap-2 text-sm font-semibold">
                      <span>
                        {g.away} @ {g.home}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {g.status === "final" ? `${g.awayScore}-${g.homeScore}` : g.status}
                      </span>
                    </div>
                    <p className="mb-1.5 text-xs text-muted">
                      Projected {first.projectedAway}-{first.projectedHome} · total {first.projectedTotal}
                    </p>
                    <ul className="space-y-1 text-sm">
                      {gp.map(({ pick, result }) => (
                        <li key={pick.id} className="flex items-baseline justify-between gap-2">
                          <span className="min-w-0">
                            <span className="text-xs uppercase text-muted">{pick.market} </span>
                            {pick.pickText}
                            {pick.isValue && (
                              <span className="ml-1 rounded bg-accent/15 px-1 text-xs font-semibold text-accent">
                                value
                              </span>
                            )}
                          </span>
                          <span className="flex shrink-0 gap-2 tabular-nums">
                            <span className="text-muted">
                              {pct(pick.probability)} {tierLabel(pick.tier)}
                            </span>
                            <span className="w-12 text-right text-muted">{american(pick.oddsUsed)}</span>
                            <span className={`w-4 font-semibold ${resultClass(result?.result)}`}>
                              {result?.result ?? ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      <Card title="Tickets">
        <p className="mb-2 text-sm">
          Staked {money(staked)} · returned {money(returned)} ·{" "}
          <span className={returned - staked >= 0 ? "text-win" : "text-loss"}>net {money(returned - staked)}</span>
        </p>
        {tix.length === 0 ? (
          <Empty>No tickets yet.</Empty>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {tix.map((t) => (
              <li key={t.id} className="py-2">
                <div className="flex justify-between gap-2">
                  <span className="min-w-0">{t.description}</span>
                  <span className={`shrink-0 font-semibold ${resultClass(t.result)}`}>{t.result}</span>
                </div>
                <div className="flex justify-between gap-2 text-xs text-muted">
                  <span>
                    {t.placedAt.toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {american(t.odds)} · stake {money(t.stake)}
                  </span>
                  <span className="shrink-0">return {money(t.return)}</span>
                </div>
                {t.notes && <p className="text-xs text-muted">{t.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
