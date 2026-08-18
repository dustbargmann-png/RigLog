import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { logout } from "@/app/logout/actions";
import { BottomNav } from "./bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already gates unauthenticated requests, but a signed-in auth
  // user whose company/profile bootstrap failed shouldn't see stale data.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-baseline gap-1 text-lg font-bold text-white">
            Rig<span className="text-gold-400">Log</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-navy-200 sm:inline">{user.companyName}</span>
            <form action={logout}>
              <button
                type="submit"
                className="min-h-8 rounded-md px-2 text-sm font-medium text-navy-200 active:bg-navy-700"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24">{children}</main>

      <BottomNav />
    </div>
  );
}
