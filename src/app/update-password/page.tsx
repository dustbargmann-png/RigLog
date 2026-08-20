import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { updatePassword } from "./actions";

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
        <h1 className="text-2xl font-bold">Link expired</h1>
        <p className="text-sm text-gray-600">
          This password reset link is no longer valid. Request a new one from the login page.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold">Set a new password</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={updatePassword} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">New password</span>
          <input
            name="password"
            type="password"
            minLength={6}
            required
            autoFocus
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          />
        </label>

        <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
          Save password
        </SubmitButton>
      </form>
    </main>
  );
}
