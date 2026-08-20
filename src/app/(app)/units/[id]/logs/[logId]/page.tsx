import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, InspectionLogItem, InspectionLogPhoto } from "@/lib/types";
import { deleteLog } from "../actions";
import { DeleteLogButton } from "../delete-log-button";

const RESPONSE_LABELS: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  yes: "Yes",
  no: "No",
};

const STATUS_STYLES: Record<string, string> = {
  pass: "bg-green-50 text-green-700",
  fail: "bg-red-50 text-red-700",
  needs_follow_up: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  pass: "Pass",
  fail: "Fail",
  needs_follow_up: "Needs follow-up",
};

type LogWithRelations = {
  id: string;
  performed_at: string;
  overall_status: string;
  notes: string | null;
  template_id: string | null;
  users: { name: string } | { name: string }[] | null;
  checklist_templates: { name: string; category: string | null } | { name: string; category: string | null }[] | null;
  inventory_items: { name: string } | { name: string }[] | null;
};

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function LogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; logId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: unitId, logId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: log } = await supabase
    .from("inspection_logs")
    .select("*, users(name), checklist_templates(name, category), inventory_items(name)")
    .eq("id", logId)
    .eq("unit_id", unitId)
    .maybeSingle<LogWithRelations>();

  if (!log) notFound();

  const performedBy = one(log.users);
  const template = one(log.checklist_templates);
  const inventoryItem = one(log.inventory_items);

  const { data: photos } = await supabase
    .from("inspection_log_photos")
    .select("*")
    .eq("inspection_log_id", logId)
    .returns<InspectionLogPhoto[]>();

  let rows: { label: string; responseType: string; response: string | null }[] = [];

  if (log.template_id) {
    const { data: checklistItems } = await supabase
      .from("checklist_items")
      .select("*")
      .eq("template_id", log.template_id)
      .order("sort_order", { ascending: true })
      .returns<ChecklistItem[]>();

    const { data: logItems } = await supabase
      .from("inspection_log_items")
      .select("*")
      .eq("inspection_log_id", logId)
      .returns<InspectionLogItem[]>();

    const responseByItemId = new Map((logItems ?? []).map((li) => [li.checklist_item_id, li.response]));

    rows = (checklistItems ?? []).map((ci) => ({
      label: ci.label,
      responseType: ci.response_type,
      response: responseByItemId.get(ci.id) ?? null,
    }));
  }

  const deleteThisLog = deleteLog.bind(null, unitId, logId);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div>
        <h1 className="text-xl font-bold">
          {template ? template.name : inventoryItem ? `Service: ${inventoryItem.name}` : "Service log"}
        </h1>
        <p className="text-gray-600">
          {new Date(log.performed_at).toLocaleString()} · {performedBy?.name ?? "Unknown"}
        </p>
      </div>

      <span
        className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[log.overall_status]}`}
      >
        {STATUS_LABELS[log.overall_status]}
      </span>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 text-sm"
            >
              <span>{row.label}</span>
              <span className="flex-shrink-0 font-medium text-gray-700">
                {row.response ? (RESPONSE_LABELS[row.response] ?? row.response) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}

      {log.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="font-medium text-gray-500">Notes</p>
          <p className="whitespace-pre-wrap">{log.notes}</p>
        </div>
      )}

      {photos && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.id}
              src={photo.photo_url}
              alt="Log attachment"
              className="aspect-square w-full rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <DeleteLogButton action={deleteThisLog} />
    </div>
  );
}
