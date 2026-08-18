import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { logout } from "@/app/logout/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // Middleware already gates unauthenticated requests, but a signed-in auth
  // user whose company/profile bootstrap failed shouldn't see stale data.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            RigLog
          </Link>
          <span className="hidden text-sm text-gray-500 sm:inline">{user.companyName}</span>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-2 pb-2">
          <Link
            href="/"
            className="min-h-11 flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 active:bg-gray-100"
          >
            Dashboard
          </Link>
          <Link
            href="/units"
            className="min-h-11 flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 active:bg-gray-100"
          >
            Units
          </Link>
          <Link
            href="/checklists"
            className="min-h-11 flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-gray-700 active:bg-gray-100"
          >
            Checklists
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="min-h-11 rounded-md px-3 py-2 text-sm font-medium text-gray-500 active:bg-gray-100"
            >
              Log out
            </button>
          </form>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
