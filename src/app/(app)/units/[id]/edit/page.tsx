import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Unit } from "@/lib/types";
import { updateUnit } from "../../actions";
import { UnitForm } from "../../unit-form";

export default async function EditUnitPage({
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

  const updateUnitWithId = updateUnit.bind(null, unit.id);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Edit {unit.label}</h1>
      <UnitForm action={updateUnitWithId} unit={unit} error={error} submitLabel="Save changes" />
    </div>
  );
}
