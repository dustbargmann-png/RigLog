"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

async function uploadPhotoIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  unitId: string,
  itemId: string,
  formData: FormData,
): Promise<string | null> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${companyId}/${unitId}/inventory/${itemId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("photos").upload(path, photo, {
    contentType: photo.type,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

function fieldsFromFormData(formData: FormData) {
  return {
    name: formData.get("name") as string,
    category: (formData.get("category") as string) || null,
    model: (formData.get("model") as string) || null,
    serial_number: (formData.get("serial_number") as string) || null,
    install_date: (formData.get("install_date") as string) || null,
    warranty_expiration_date: (formData.get("warranty_expiration_date") as string) || null,
    next_maintenance_date: (formData.get("next_maintenance_date") as string) || null,
    condition: (formData.get("condition") as string) || "good",
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createInventoryItem(unitId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({ unit_id: unitId, ...fieldsFromFormData(formData) })
    .select("id")
    .single();

  if (error || !item) {
    redirect(
      `/units/${unitId}/inventory/new?error=${encodeURIComponent(error?.message ?? "Could not create item")}`,
    );
  }

  const photoUrl = await uploadPhotoIfPresent(supabase, user.companyId, unitId, item.id, formData);
  if (photoUrl) {
    await supabase.from("inventory_items").update({ photo_url: photoUrl }).eq("id", item.id);
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}`);
}

export async function updateInventoryItem(unitId: string, itemId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const photoUrl = await uploadPhotoIfPresent(supabase, user.companyId, unitId, itemId, formData);

  const { error } = await supabase
    .from("inventory_items")
    .update({ ...fieldsFromFormData(formData), ...(photoUrl ? { photo_url: photoUrl } : {}) })
    .eq("id", itemId);

  if (error) {
    redirect(
      `/units/${unitId}/inventory/${itemId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}`);
}

export async function deleteInventoryItem(unitId: string, itemId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("inventory_items").delete().eq("id", itemId);

  if (error) {
    redirect(
      `/units/${unitId}/inventory/${itemId}/edit?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}`);
}
