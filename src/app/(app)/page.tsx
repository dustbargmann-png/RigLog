import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { buildInspectionAlerts, buildInventoryAlerts, describeUrgency } from "@/lib/dashboard";

const KIND_LABELS: Record<string, string> = {
  inspection: "Inspection",
  warranty: "Warranty",
  maintenance: "Maintenance",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const [{ data: units }, { data: templates }, { data: logs }, { data: inventoryItems }] = await Promise.all([
    supabase.from("units").select("id, label"),
    supabase.from("checklist_templates").select("id, name, interval_days").eq("is_active", true),
    supabase.from("inspection_logs").select("unit_id, template_id, performed_at").not("template_id", "is", null),
    supabase
      .from("inventory_items")
      .select("id, unit_id, name, warranty_expiration_date, next_maintenance_date"),
  ]);

  const unitLabelById = new Map((units ?? []).map((u) => [u.id, u.label]));

  const alerts = [
    ...buildInspectionAlerts(units ?? [], templates ?? [], (logs ?? []) as { unit_id: string; template_id: string; performed_at: string }[]),
    ...buildInventoryAlerts(inventoryItems ?? [], unitLabelById),
  ].sort((a, b) => a.daysUntil - b.daysUntil);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
        <p className="text-gray-600">{user?.companyName}</p>
      </div>

      <h2 className="font-semibold">Needs attention</h2>

      {alerts.length === 0 ? (
        <p className="text-sm text-gray-600">All caught up — nothing due or expiring soon.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => {
            const urgency = describeUrgency(alert);
            return (
              <Link
                key={alert.key}
                href={alert.href}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{alert.title}</p>
                  <p className="truncate text-sm text-gray-600">
                    {alert.unitLabel} · {KIND_LABELS[alert.kind]}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${urgency.style}`}
                >
                  {urgency.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
