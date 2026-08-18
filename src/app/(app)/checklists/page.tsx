import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistTemplate } from "@/lib/types";

export default async function ChecklistsPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("is_active", true)
    .order("company_id", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .returns<ChecklistTemplate[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Checklists</h1>
        <Link
          href="/checklists/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white active:bg-blue-700"
        >
          + New template
        </Link>
      </div>

      {!templates || templates.length === 0 ? (
        <p className="text-gray-600">No checklist templates yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/checklists/${t.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.name}</p>
                <p className="truncate text-sm text-gray-600">
                  {[t.category, `every ${t.interval_days}d`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  t.company_id
                    ? "bg-purple-50 text-purple-700"
                    : "bg-gray-100 text-gray-600"
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
