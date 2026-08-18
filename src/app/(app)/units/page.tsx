import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Unit } from "@/lib/types";

export default async function UnitsPage() {
  const supabase = await createClient();
  const { data: units } = await supabase
    .from("units")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Unit[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Units</h1>
        <Link
          href="/units/new"
          className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white active:bg-blue-700"
        >
          + New unit
        </Link>
      </div>

      {!units || units.length === 0 ? (
        <p className="text-gray-600">No units yet. Add your first one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {units.map((unit) => (
            <Link
              key={unit.id}
              href={`/units/${unit.id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              {unit.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={unit.photo_url}
                  alt={unit.label}
                  className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                  No photo
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{unit.label}</p>
                {unit.unit_type && (
                  <span className="mb-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {unit.unit_type}
                  </span>
                )}
                <p className="truncate text-sm text-gray-600">
                  {[unit.year, unit.make, unit.model].filter(Boolean).join(" ") || "No details yet"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
