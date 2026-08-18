import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";
import { deleteInventoryItem, updateInventoryItem } from "../../actions";
import { InventoryItemForm } from "../../inventory-form";
import { DeleteItemButton } from "../../delete-item-button";

export default async function EditInventoryItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; itemId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: unitId, itemId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", itemId)
    .eq("unit_id", unitId)
    .maybeSingle<InventoryItem>();

  if (!item) notFound();

  const updateItem = updateInventoryItem.bind(null, unitId, itemId);
  const deleteItem = deleteInventoryItem.bind(null, unitId, itemId);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Edit {item.name}</h1>
      <InventoryItemForm action={updateItem} item={item} error={error} submitLabel="Save changes" />
      <DeleteItemButton action={deleteItem} />
    </div>
  );
}
