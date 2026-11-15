import { Card, Empty, PageHeader } from "@/components/ui";
import { checkDb, configStatus } from "@/lib/status";
import { logout } from "../../login/actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await checkDb();
  const config = configStatus();
  return (
    <>
      <PageHeader title="Settings">
        <form action={logout}>
          <button className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
            Sign out
          </button>
        </form>
      </PageHeader>

      <Card title="Model version">
        <Empty>No model version stored yet. Version 1 (the Nov 14 parameters) is created in milestone 2.</Empty>
      </Card>

      <Card title="Database">
        {db.ok ? (
          <p className="text-sm">
            <span className="font-semibold text-win">Connected</span> · {db.migrations} migration
            {db.migrations === 1 ? "" : "s"} applied · {db.latencyMs} ms
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold text-loss">Not connected</span>
            <span className="block break-words text-muted">{db.error}</span>
          </p>
        )}
      </Card>

      <Card title="Server settings">
        <ul className="divide-y divide-line text-sm">
          {config.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 py-2">
              <span>
                {c.label} <code className="text-xs text-muted">{c.key}</code>
              </span>
              <span className={c.set ? "text-win" : "text-warn"}>{c.set ? "Set" : "Missing"}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Data sources">
        <Empty>Last successful pull and API calls left per source: milestone 3.</Empty>
      </Card>

      <Card title="Bankroll caps">
        <Empty>Milestone 6.</Empty>
      </Card>
    </>
  );
}
