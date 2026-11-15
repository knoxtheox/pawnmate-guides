import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-line bg-surface p-4">
      {title && <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Button({
  children,
  variant = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "bg-accent text-accent-ink"
      : "border border-line bg-surface text-ink";
  return (
    <button
      type={type}
      disabled={disabled}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}
