import { createUnit } from "../actions";
import { UnitForm } from "../unit-form";

export default async function NewUnitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">New unit</h1>
      <UnitForm action={createUnit} error={error} submitLabel="Create unit" />
    </div>
  );
}
