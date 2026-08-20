import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { sendResetLink } from "./actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">Reset your password</h1>

      {sent ? (
        <p className="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form action={sendResetLink} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
            />
          </label>

          <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
            Send reset link
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-sm text-gray-600">
        <Link href="/login" className="font-medium text-navy-700">
          Back to login
        </Link>
      </p>
    </main>
  );
}
