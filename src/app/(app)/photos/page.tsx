import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PhotoEntry = {
  id: string;
  url: string;
  unitLabel: string;
  title: string;
  equipmentCategory: string | null;
  inspectionCategory: string | null;
  isService: boolean;
  href: string;
  createdAt: string;
};

type GroupMode = "unit" | "equipment" | "inspection";

function groupKeyFor(entry: PhotoEntry, mode: GroupMode): string {
  if (mode === "unit") return entry.unitLabel;
  if (mode === "equipment") return entry.equipmentCategory ?? "Other";
  return entry.inspectionCategory ?? (entry.isService ? "Service (no checklist)" : "Not from an inspection");
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const { group } = await searchParams;
  const mode: GroupMode = group === "equipment" || group === "inspection" ? group : "unit";

  const supabase = await createClient();

  const [{ data: units }, { data: inventoryItems }, { data: logPhotos }] = await Promise.all([
    supabase
      .from("units")
      .select("id, label, photo_url, created_at")
      .not("photo_url", "is", null),
    supabase
      .from("inventory_items")
      .select("id, unit_id, name, category, photo_url, created_at, units(label)")
      .not("photo_url", "is", null),
    supabase
      .from("inspection_log_photos")
      .select(
        "id, photo_url, created_at, inspection_logs(id, unit_id, template_id, units(label), checklist_templates(name, category), inventory_items(name, category))",
      ),
  ]);

  const entries: PhotoEntry[] = [];

  for (const unit of units ?? []) {
    entries.push({
      id: `unit-${unit.id}`,
      url: unit.photo_url!,
      unitLabel: unit.label,
      title: `${unit.label} (unit photo)`,
      equipmentCategory: null,
      inspectionCategory: null,
      isService: false,
      href: `/units/${unit.id}`,
      createdAt: unit.created_at,
    });
  }

  for (const item of inventoryItems ?? []) {
    const unit = Array.isArray(item.units) ? item.units[0] : item.units;
    entries.push({
      id: `item-${item.id}`,
      url: item.photo_url!,
      unitLabel: unit?.label ?? "Unknown unit",
      title: item.name,
      equipmentCategory: item.category,
      inspectionCategory: null,
      isService: false,
      href: `/units/${item.unit_id}/inventory/${item.id}/edit`,
      createdAt: item.created_at,
    });
  }

  for (const photo of logPhotos ?? []) {
    const log = Array.isArray(photo.inspection_logs) ? photo.inspection_logs[0] : photo.inspection_logs;
    if (!log) continue;
    const unit = Array.isArray(log.units) ? log.units[0] : log.units;
    const template = Array.isArray(log.checklist_templates)
      ? log.checklist_templates[0]
      : log.checklist_templates;
    const invItem = Array.isArray(log.inventory_items) ? log.inventory_items[0] : log.inventory_items;

    entries.push({
      id: `log-${photo.id}`,
      url: photo.photo_url,
      unitLabel: unit?.label ?? "Unknown unit",
      title: template ? template.name : invItem ? `Service: ${invItem.name}` : "Service log",
      equipmentCategory: invItem?.category ?? null,
      inspectionCategory: template?.category ?? null,
      isService: !template,
      href: `/units/${log.unit_id}/logs/${log.id}`,
      createdAt: photo.created_at,
    });
  }

  entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const groups = new Map<string, PhotoEntry[]>();
  for (const entry of entries) {
    const key = groupKeyFor(entry, mode);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const sortedGroupKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));

  const TABS: { value: GroupMode; label: string }[] = [
    { value: "unit", label: "By unit" },
    { value: "equipment", label: "By equipment" },
    { value: "inspection", label: "By inspection" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Photos</h1>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/photos?group=${tab.value}`}
            className={`min-h-11 flex-1 rounded-md px-3 py-2 text-center text-sm font-semibold ${
              mode === tab.value
                ? "bg-navy-700 text-white"
                : "border border-gray-300 text-gray-700 active:bg-gray-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-600">No photos uploaded yet.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {sortedGroupKeys.map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <h2 className="font-semibold">
                {key} <span className="font-normal text-gray-500">({groups.get(key)!.length})</span>
              </h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {groups.get(key)!.map((entry) => (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="group flex flex-col gap-1"
                    title={entry.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.url}
                      alt={entry.title}
                      className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                    />
                    <p className="truncate text-xs text-gray-600">{entry.title}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
