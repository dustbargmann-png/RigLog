import { createInventoryItem } from "../actions";
import { InventoryItemForm } from "../inventory-form";

export default async function NewInventoryItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: unitId } = await params;
  const { error } = await searchParams;

  const createItemForUnit = createInventoryItem.bind(null, unitId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">New inventory item</h1>
      <InventoryItemForm action={createItemForUnit} error={error} submitLabel="Add item" />
    </div>
  );
}
