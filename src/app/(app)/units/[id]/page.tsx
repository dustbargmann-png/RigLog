import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem, Unit } from "@/lib/types";
import { deleteUnit } from "../actions";
import { DeleteUnitButton } from "../delete-unit-button";

const CONDITION_STYLES: Record<InventoryItem["condition"], string> = {
  good: "bg-green-50 text-green-700",
  needs_attention: "bg-amber-50 text-amber-700",
  out_of_service: "bg-red-50 text-red-700",
};

const CONDITION_LABELS: Record<InventoryItem["condition"], string> = {
  good: "Good",
  needs_attention: "Needs attention",
  out_of_service: "Out of service",
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

type LogSummary = {
  id: string;
  performed_at: string;
  overall_status: string;
  checklist_templates: { name: string } | { name: string }[] | null;
  inventory_items: { name: string } | { name: string }[] | null;
};

function one<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export default async function UnitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .maybeSingle<Unit>();

  if (!unit) notFound();

  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("unit_id", unit.id)
    .order("created_at", { ascending: false })
    .returns<InventoryItem[]>();

  const { data: logs } = await supabase
    .from("inspection_logs")
    .select("id, performed_at, overall_status, checklist_templates(name), inventory_items(name)")
    .eq("unit_id", unit.id)
    .order("performed_at", { ascending: false })
    .returns<LogSummary[]>();

  const deleteUnitWithId = deleteUnit.bind(null, unit.id);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{unit.label}</h1>
          {unit.unit_type && (
            <span className="mb-1 mt-1 inline-block rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">
              {unit.unit_type}
            </span>
          )}
          <p className="text-gray-600">
            {[unit.year, unit.make, unit.model].filter(Boolean).join(" ") || "No details yet"}
          </p>
        </div>
        <Link
          href={`/units/${unit.id}/edit`}
          className="min-h-11 flex-shrink-0 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold active:bg-gray-100"
        >
          Edit
        </Link>
      </div>

      {unit.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={unit.photo_url}
          alt={unit.label}
          className="max-h-64 w-full rounded-lg object-cover"
        />
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <dt className="text-gray-500">VIN</dt>
        <dd>{unit.vin || "—"}</dd>
        <dt className="text-gray-500">Year</dt>
        <dd>{unit.year || "—"}</dd>
        <dt className="text-gray-500">Make</dt>
        <dd>{unit.make || "—"}</dd>
        <dt className="text-gray-500">Model</dt>
        <dd>{unit.model || "—"}</dd>
      </dl>

      {unit.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="font-medium text-gray-500">Notes</p>
          <p className="whitespace-pre-wrap">{unit.notes}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Equipment inventory</h2>
          <Link
            href={`/units/${unit.id}/inventory/new`}
            className="min-h-11 rounded-md bg-navy-700 px-4 py-2 text-sm font-semibold text-white active:bg-navy-800"
          >
            + Add item
          </Link>
        </div>

        {!inventoryItems || inventoryItems.length === 0 ? (
          <p className="text-sm text-gray-600">No inventory items yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {inventoryItems.map((item) => (
              <Link
                key={item.id}
                href={`/units/${unit.id}/inventory/${item.id}/edit`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
              >
                {item.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photo_url}
                    alt={item.name}
                    className="h-12 w-12 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="truncate text-sm text-gray-600">
                    {[item.category, item.model].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CONDITION_STYLES[item.condition]}`}
                >
                  {CONDITION_LABELS[item.condition]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Inspection &amp; service history</h2>
          <div className="flex gap-2">
            <Link
              href={`/units/${unit.id}/service/new`}
              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold active:bg-gray-100"
            >
              Log service
            </Link>
            <Link
              href={`/units/${unit.id}/inspect`}
              className="min-h-11 rounded-md bg-navy-700 px-3 py-2 text-sm font-semibold text-white active:bg-navy-800"
            >
              Run checklist
            </Link>
          </div>
        </div>

        {!logs || logs.length === 0 ? (
          <p className="text-sm text-gray-600">No inspections or service logged yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => {
              const template = one(log.checklist_templates);
              const inventoryItem = one(log.inventory_items);
              return (
                <Link
                  key={log.id}
                  href={`/units/${unit.id}/logs/${log.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3 active:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {template ? template.name : inventoryItem ? `Service: ${inventoryItem.name}` : "Service log"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(log.performed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[log.overall_status]}`}
                  >
                    {STATUS_LABELS[log.overall_status]}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <DeleteUnitButton action={deleteUnitWithId} />
    </div>
  );
}
