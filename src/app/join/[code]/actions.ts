"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinSignup(code: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { invite_code: code, name },
    },
  });

  if (error) {
    redirect(`/join/${code}?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    redirect(
      "/login?error=" + encodeURIComponent("Check your email to confirm your account, then log in."),
    );
  }

  redirect("/");
}
