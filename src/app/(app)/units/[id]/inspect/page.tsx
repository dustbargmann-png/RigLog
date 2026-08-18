import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistTemplate, Unit } from "@/lib/types";

export default async function PickTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: unitId } = await params;
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("units")
    .select("*")
    .eq("id", unitId)
    .maybeSingle<Unit>();

  if (!unit) notFound();

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("is_active", true)
    .order("company_id", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .returns<ChecklistTemplate[]>();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Run a checklist on {unit.label}</h1>

      {!templates || templates.length === 0 ? (
        <p className="text-gray-600">No checklist templates yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/units/${unitId}/inspect/${t.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.name}</p>
                <p className="truncate text-sm text-gray-600">{t.category}</p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.company_id ? "bg-gold-50 text-gold-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.company_id ? "Custom" : "Global"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
