"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendResetLink(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/confirm?next=/update-password`,
  });

  // Supabase's error here is a genuine system failure (rate limit,
  // misconfigured redirect URL, etc.) — it does NOT reveal whether the email
  // has an account, so surfacing it doesn't create an enumeration risk.
  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/forgot-password?sent=1");
}
