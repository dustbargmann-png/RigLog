import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: "admin" | "technician";
  companyName: string;
};

// Reads the signed-in user's app-level profile (company + role). On a brand-new
// account there's no `users` row yet — this bootstraps it from the signup-time
// metadata stashed on the auth user, which also covers the email-confirmation
// case where the company couldn't be created at signup time.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  let { data: profile } = await supabase
    .from("users")
    .select("id, company_id, name, email, role, companies(name)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile) {
    await supabase.rpc("create_company_and_admin", {
      company_name: authUser.user_metadata.company_name ?? "My Company",
      user_name: authUser.user_metadata.name ?? authUser.email,
    });

    ({ data: profile } = await supabase
      .from("users")
      .select("id, company_id, name, email, role, companies(name)")
      .eq("id", authUser.id)
      .maybeSingle());
  }

  if (!profile) return null;

  const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies;

  return {
    id: profile.id,
    companyId: profile.company_id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    companyName: company?.name ?? "",
  };
}
