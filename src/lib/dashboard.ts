const WINDOW_DAYS = 30;
const NEVER_DONE_RANK = -999999;

export type DashboardAlert = {
  key: string;
  kind: "inspection" | "warranty" | "maintenance";
  unitLabel: string;
  title: string;
  daysUntil: number;
  neverDone: boolean;
  href: string;
};

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.floor(ms / 86_400_000);
}

export function buildInspectionAlerts(
  units: { id: string; label: string }[],
  templates: { id: string; name: string; interval_days: number }[],
  logs: { unit_id: string; template_id: string; performed_at: string }[],
): DashboardAlert[] {
  const lastRun = new Map<string, string>();
  for (const log of logs) {
    const key = `${log.unit_id}:${log.template_id}`;
    const existing = lastRun.get(key);
    if (!existing || log.performed_at > existing) lastRun.set(key, log.performed_at);
  }

  const alerts: DashboardAlert[] = [];

  for (const unit of units) {
    for (const template of templates) {
      const key = `${unit.id}:${template.id}`;
      const lastPerformedAt = lastRun.get(key);

      if (!lastPerformedAt) {
        alerts.push({
          key,
          kind: "inspection",
          unitLabel: unit.label,
          title: template.name,
          daysUntil: NEVER_DONE_RANK,
          neverDone: true,
          href: `/units/${unit.id}/inspect/${template.id}`,
        });
        continue;
      }

      const dueDate = new Date(lastPerformedAt);
      dueDate.setDate(dueDate.getDate() + template.interval_days);
      const due = daysUntil(dueDate.toISOString());

      if (due <= WINDOW_DAYS) {
        alerts.push({
          key,
          kind: "inspection",
          unitLabel: unit.label,
          title: template.name,
          daysUntil: due,
          neverDone: false,
          href: `/units/${unit.id}/inspect/${template.id}`,
        });
      }
    }
  }

  return alerts;
}

export function buildInventoryAlerts(
  items: {
    id: string;
    unit_id: string;
    name: string;
    warranty_expiration_date: string | null;
    next_maintenance_date: string | null;
  }[],
  unitLabelById: Map<string, string>,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  for (const item of items) {
    const unitLabel = unitLabelById.get(item.unit_id) ?? "Unknown unit";
    const href = `/units/${item.unit_id}/inventory/${item.id}/edit`;

    if (item.warranty_expiration_date) {
      const due = daysUntil(item.warranty_expiration_date);
      if (due <= WINDOW_DAYS) {
        alerts.push({
          key: `${item.id}:warranty`,
          kind: "warranty",
          unitLabel,
          title: `${item.name} — warranty`,
          daysUntil: due,
          neverDone: false,
          href,
        });
      }
    }

    if (item.next_maintenance_date) {
      const due = daysUntil(item.next_maintenance_date);
      if (due <= WINDOW_DAYS) {
        alerts.push({
          key: `${item.id}:maintenance`,
          kind: "maintenance",
          unitLabel,
          title: `${item.name} — maintenance`,
          daysUntil: due,
          neverDone: false,
          href,
        });
      }
    }
  }

  return alerts;
}

export function describeUrgency(alert: DashboardAlert): { label: string; style: string } {
  if (alert.neverDone) {
    return { label: "Never inspected", style: "bg-red-50 text-red-700" };
  }
  if (alert.daysUntil < 0) {
    return { label: `Overdue by ${-alert.daysUntil}d`, style: "bg-red-50 text-red-700" };
  }
  if (alert.daysUntil === 0) {
    return { label: "Due today", style: "bg-red-50 text-red-700" };
  }
  return { label: `Due in ${alert.daysUntil}d`, style: "bg-amber-50 text-amber-700" };
}
