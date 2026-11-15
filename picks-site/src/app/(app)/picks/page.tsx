import { Button, Card, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Picks" };

const SPORTS = ["CFB", "NFL", "NFL ATTD"] as const;

export default function PicksPage() {
  return (
    <>
      <PageHeader title="Picks">
        <Button disabled>Show Picks</Button>
        <Button variant="secondary" disabled>
          Refresh Odds
        </Button>
      </PageHeader>
      <div role="tablist" aria-label="Sport" className="mb-4 grid grid-cols-3 rounded-lg border border-line bg-surface p-1">
        {SPORTS.map((s, i) => (
          <span
            key={s}
            role="tab"
            aria-selected={i === 0}
            className={`rounded-md py-2 text-center text-sm font-medium ${i === 0 ? "bg-accent text-accent-ink" : "text-muted"}`}
          >
            {s}
          </span>
        ))}
      </div>
      <Card title="This week">
        <Empty>
          No slate yet. Games, projected scores, win %, spread and total picks, confidence tiers and FanDuel
          value arrive in milestone 4.
        </Empty>
      </Card>
    </>
  );
}
