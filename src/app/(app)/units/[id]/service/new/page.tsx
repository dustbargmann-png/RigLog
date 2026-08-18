import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem, Unit } from "@/lib/types";
import { createServiceLog } from "../../logs/actions";

export default async function NewServiceLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: unitId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", unitId)
    .maybeSingle<Unit>();

  if (!unit) notFound();

  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("unit_id", unitId)
    .order("name", { ascending: true })
    .returns<InventoryItem[]>();

  const submitLog = createServiceLog.bind(null, unitId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Log service on {unit.label}</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={submitLog} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Equipment (optional)</span>
          <select
            name="inventory_item_id"
            defaultValue=""
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          >
            <option value="">General / whole unit</option>
            {(inventoryItems ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select
            name="overall_status"
            defaultValue="pass"
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          >
            <option value="pass">Completed</option>
            <option value="fail">Failed / not resolved</option>
            <option value="needs_follow_up">Needs follow-up</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={4}
            placeholder="What was done?"
            className="rounded-md border border-gray-300 px-4 py-3 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Photos</span>
          <input
            name="photos"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="min-h-12 rounded-md border border-gray-300 px-4 py-3 text-base"
          />
        </label>

        <button
          type="submit"
          className="min-h-12 rounded-md bg-blue-600 px-4 text-base font-semibold text-white active:bg-blue-700"
        >
          Save service log
        </button>
      </form>
    </div>
  );
}
