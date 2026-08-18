import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import type { ChecklistItem, ChecklistTemplate, Unit } from "@/lib/types";
import { createInspectionLog } from "../../logs/actions";

export default async function RunChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; templateId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: unitId, templateId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", unitId)
    .maybeSingle<Unit>();

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle<ChecklistTemplate>();

  if (!unit || !template) notFound();

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true })
    .returns<ChecklistItem[]>();

  const submitLog = createInspectionLog.bind(null, unitId, templateId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">{template.name}</h1>
        <p className="text-gray-600">on {unit.label}</p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <form action={submitLog} className="flex flex-col gap-4">
        {(items ?? []).map((item) => (
          <label key={item.id} className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {item.label}
              {item.is_required && <span className="text-red-500"> *</span>}
            </span>
            {(item.response_type === "pass_fail" || item.response_type === "yes_no") && (
              <select
                name={`item_${item.id}`}
                required={item.is_required}
                defaultValue=""
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              >
                <option value="" disabled>
                  Select…
                </option>
                {item.response_type === "pass_fail" ? (
                  <>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </>
                ) : (
                  <>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </>
                )}
              </select>
            )}
            {item.response_type === "text" && (
              <input
                name={`item_${item.id}`}
                required={item.is_required}
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              />
            )}
            {item.response_type === "number" && (
              <input
                name={`item_${item.id}`}
                type="number"
                inputMode="decimal"
                required={item.is_required}
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              />
            )}
            {item.response_type === "date" && (
              <input
                name={`item_${item.id}`}
                type="date"
                required={item.is_required}
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              />
            )}
          </label>
        ))}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Overall status</span>
          <select
            name="overall_status"
            defaultValue="pass"
            className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
          >
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="needs_follow_up">Needs follow-up</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea
            name="notes"
            rows={3}
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

        <SubmitButton
          className="min-h-12 rounded-md bg-navy-700 px-4 text-base font-semibold text-white active:bg-navy-800"
          pendingText="Submitting…"
        >
          Submit inspection
        </SubmitButton>
      </form>
    </div>
  );
}
