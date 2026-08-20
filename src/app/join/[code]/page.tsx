import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { joinSignup } from "./actions";

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { code } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: companyName } = await supabase.rpc("company_name_for_invite", {
    invite_code_input: code,
  });

  if (!companyName) notFound();

  const submitJoin = joinSignup.bind(null, code);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold">Join {companyName} on RigMaintenance</h1>
        <p className="mt-1 text-sm text-gray-600">
          You&apos;ve been invited as a technician. Set up your login below.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={submitJoin} className="flex flex-col gap-4">
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

        <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
          Create account
        </SubmitButton>
      </form>
    </main>
  );
}
