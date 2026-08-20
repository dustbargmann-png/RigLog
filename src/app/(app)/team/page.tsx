import Link from "next/link";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { regenerateInviteCode } from "./actions";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "technician";
};

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Team</h1>
        <p className="text-gray-600">Only admins can manage the team.</p>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: company }, { data: members }] = await Promise.all([
    supabase.from("companies").select("invite_code").eq("id", user.companyId).single(),
    supabase
      .from("users")
      .select("id, name, email, role")
      .order("role", { ascending: true })
      .returns<TeamMember[]>(),
  ]);

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const inviteUrl = company ? `${protocol}://${host}/join/${company.invite_code}` : "";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Team</h1>

      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium">Invite a technician</p>
        <p className="text-xs text-gray-500">
          Share this link — anyone who signs up with it joins your company as a technician.
        </p>
        <p className="break-all rounded-md bg-gray-50 px-3 py-2 text-sm text-navy-700">{inviteUrl}</p>
        <form action={regenerateInviteCode}>
          <SubmitButton className="min-h-11 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold active:bg-gray-100">
            Generate new link
          </SubmitButton>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold">Members</h2>
        {(members ?? []).map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{member.name}</p>
              <p className="truncate text-sm text-gray-600">{member.email}</p>
            </div>
            {member.role === "admin" ? (
              <span className="flex-shrink-0 rounded-full bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-700">
                Admin
              </span>
            ) : (
              <Link
                href={`/team/${member.id}`}
                className="min-h-11 flex-shrink-0 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold active:bg-gray-100"
              >
                Manage access
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
