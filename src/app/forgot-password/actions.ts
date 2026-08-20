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

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/confirm?next=/update-password`,
  });

  // Always show the same message regardless of whether the email exists,
  // so this can't be used to check which emails have accounts.
  redirect("/forgot-password?sent=1");
}
