import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { SubmitButton } from "@/components/submit-button";
import type { ChecklistItem, ChecklistTemplate } from "@/lib/types";
import {
  addChecklistItem,
  deleteChecklistItem,
  deleteTemplate,
  forkTemplate,
  updateChecklistItem,
  updateTemplate,
} from "../actions";
import { DeleteTemplateButton } from "../delete-template-button";
import { DeleteChecklistItemButton } from "../delete-checklist-item-button";

const RESPONSE_TYPES: { value: ChecklistItem["response_type"]; label: string }[] = [
  { value: "pass_fail", label: "Pass / Fail" },
  { value: "yes_no", label: "Yes / No" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
];

export default async function TemplateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: template } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle<ChecklistTemplate>();

  if (!template) notFound();

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("template_id", id)
    .order("sort_order", { ascending: true })
    .returns<ChecklistItem[]>();

  const isOwn = template.company_id !== null && template.company_id === user?.companyId;

  const updateThisTemplate = updateTemplate.bind(null, template.id);
  const deleteThisTemplate = deleteTemplate.bind(null, template.id);
  const forkThisTemplate = forkTemplate.bind(null, template.id);
  const addItem = addChecklistItem.bind(null, template.id);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {isOwn ? (
        <form action={updateThisTemplate} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name *</span>
            <input
              name="name"
              required
              defaultValue={template.name}
              className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Category</span>
              <input
                name="category"
                defaultValue={template.category ?? ""}
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Run every (days)</span>
              <input
                name="interval_days"
                type="number"
                inputMode="numeric"
                defaultValue={template.interval_days}
                className="min-h-12 rounded-md border border-gray-300 px-4 text-base"
              />
            </label>
          </div>
          <SubmitButton className="min-h-11 self-start rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold active:bg-gray-100">
            Save details
          </SubmitButton>
        </form>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{template.name}</h1>
              <p className="text-gray-600">
                {[template.category, `every ${template.interval_days}d`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <form action={forkThisTemplate}>
              <SubmitButton className="min-h-11 flex-shrink-0 rounded-md bg-navy-700 px-4 py-2 text-sm font-semibold text-white active:bg-navy-800">
                Fork to customize
              </SubmitButton>
            </form>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            This is a global template. Fork it to edit items for your company.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">Items</h2>

        {!items || items.length === 0 ? (
          <p className="text-sm text-gray-600">No items yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) =>
              isOwn ? (
                <form
                  key={item.id}
                  action={updateChecklistItem.bind(null, template.id, item.id)}
                  className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center"
                >
                  <input
                    name="label"
                    defaultValue={item.label}
                    className="min-h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm"
                  />
                  <select
                    name="response_type"
                    defaultValue={item.response_type}
                    className="min-h-11 rounded-md border border-gray-300 px-3 text-sm"
                  >
                    {RESPONSE_TYPES.map((rt) => (
                      <option key={rt.value} value={rt.value}>
                        {rt.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex min-h-11 items-center gap-1 text-sm text-gray-600">
                    <input type="checkbox" name="is_required" defaultChecked={item.is_required} />
                    Required
                  </label>
                  <div className="flex gap-2">
                    <SubmitButton className="min-h-11 rounded-md border border-gray-300 px-3 text-sm font-semibold active:bg-gray-100">
                      Save
                    </SubmitButton>
                  </div>
                  <DeleteChecklistItemButton
                    action={deleteChecklistItem.bind(null, template.id, item.id)}
                  />
                </form>
              ) : (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 text-sm"
                >
                  <span>{item.label}</span>
                  <span className="flex-shrink-0 text-gray-500">
                    {RESPONSE_TYPES.find((rt) => rt.value === item.response_type)?.label}
                    {item.is_required ? " · Required" : ""}
                  </span>
                </div>
              ),
            )}
          </div>
        )}

        {isOwn && (
          <form
            action={addItem}
            className="flex flex-col gap-2 rounded-lg border border-dashed border-gray-300 p-3 sm:flex-row sm:items-center"
          >
            <input
              name="label"
              required
              placeholder="New item label"
              className="min-h-11 flex-1 rounded-md border border-gray-300 px-3 text-sm"
            />
            <select
              name="response_type"
              defaultValue="pass_fail"
              className="min-h-11 rounded-md border border-gray-300 px-3 text-sm"
            >
              {RESPONSE_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
            <label className="flex min-h-11 items-center gap-1 text-sm text-gray-600">
              <input type="checkbox" name="is_required" defaultChecked />
              Required
            </label>
            <SubmitButton className="min-h-11 rounded-md bg-navy-700 px-4 text-sm font-semibold text-white active:bg-navy-800">
              Add item
            </SubmitButton>
          </form>
        )}
      </div>

      {isOwn && <DeleteTemplateButton action={deleteThisTemplate} />}
    </div>
  );
}
