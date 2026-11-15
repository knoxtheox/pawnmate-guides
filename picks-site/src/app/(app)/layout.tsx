import { Nav } from "@/components/nav";
import { requireSession } from "@/lib/auth/session";
import { logout } from "../login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="hidden items-center justify-between border-b border-line bg-surface px-4 py-2 md:flex">
        <span className="font-bold">Picks</span>
        <form action={logout}>
          <button className="text-sm text-muted">Sign out</button>
        </form>
      </div>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
