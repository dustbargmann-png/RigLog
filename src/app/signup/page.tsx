import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">Set up your company on RigLog</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Company name</span>
          <input
            name="company_name"
            required
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            name="name"
            required
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            minLength={6}
            required
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <button
          type="submit"
          className="min-h-12 rounded-md bg-blue-600 px-4 text-base font-semibold text-white active:bg-blue-700"
        >
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600">
          Log in
        </Link>
      </p>
    </main>
  );
}
