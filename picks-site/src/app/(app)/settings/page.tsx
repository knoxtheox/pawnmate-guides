import { Card, Empty, PageHeader } from "@/components/ui";
import { checkDb, configStatus } from "@/lib/status";
import { logout } from "../../login/actions";
import { ParamsTable } from "@/components/params-table";
import { activeModelVersions } from "@/lib/queries";
import type { GameModelParams } from "@/engine/params";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await checkDb();
  const config = configStatus();
  const versions = db.ok ? await activeModelVersions() : [];
  return (
    <>
      <PageHeader title="Settings">
        <form action={logout}>
          <button className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold">
            Sign out
          </button>
        </form>
      </PageHeader>

      {versions.length === 0 && (
        <Card title="Model version">
          <Empty>No model version stored yet. The seed creates version 1 on deploy.</Empty>
        </Card>
      )}
      {versions.map((v) => (
        <Card key={v.id} title={`${v.sport.toUpperCase()} model · version ${v.version} (active)`}>
          <p className="mb-2 text-sm text-muted">
            {v.notes} Approved{" "}
            {v.approvedAt?.toLocaleDateString("en-US", { timeZone: "America/Chicago" }) ?? "–"}.
          </p>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-accent">Parameters</summary>
            <div className="mt-2">
              <ParamsTable params={v.parameters as GameModelParams} />
            </div>
          </details>
        </Card>
      ))}

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
