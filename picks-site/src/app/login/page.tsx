import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Picks" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/picks");
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold">Picks</h1>
      <p className="mb-6 text-sm text-muted">Private dashboard. Sign in to continue.</p>
      <LoginForm next={typeof next === "string" ? next : "/picks"} />
    </main>
  );
}
