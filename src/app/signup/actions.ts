"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const companyName = formData.get("company_name") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: companyName, name },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    // Email confirmation is required before a session exists — company/user
    // rows get created on first authenticated visit (see src/app/layout.tsx).
    redirect("/login?error=" + encodeURIComponent("Check your email to confirm your account, then log in."));
  }

  redirect("/");
}
