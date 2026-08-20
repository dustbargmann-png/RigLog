import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { saveUnitAssignments } from "../actions";

export default async function ManageAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Manage access</h1>
        <p className="text-gray-600">Only admins can manage the team.</p>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: technician }, { data: units }, { data: assignments }] = await Promise.all([
    supabase.from("users").select("id, name, email").eq("id", userId).maybeSingle(),
    supabase.from("units").select("id, label").order("label", { ascending: true }),
    supabase.from("unit_assignments").select("unit_id").eq("user_id", userId),
  ]);

  if (!technician) notFound();

  const assignedUnitIds = new Set((assignments ?? []).map((a) => a.unit_id));
  const submitAssignments = saveUnitAssignments.bind(null, userId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Manage access — {technician.name}</h1>
        <p className="text-sm text-gray-600">
          Pick which units {technician.name} can see and work on.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={submitAssignments} className="flex flex-col gap-4">
        {!units || units.length === 0 ? (
          <p className="text-sm text-gray-600">No units yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {units.map((unit) => (
              <label
                key={unit.id}
                className="flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4"
              >
                <input
                  type="checkbox"
                  name="unit_id"
                  value={unit.id}
                  defaultChecked={assignedUnitIds.has(unit.id)}
                  className="h-5 w-5"
                />
                <span className="text-sm">{unit.label}</span>
              </label>
            ))}
          </div>
        )}

        <SubmitButton className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800">
          Save access
        </SubmitButton>
      </form>
    </div>
  );
}
