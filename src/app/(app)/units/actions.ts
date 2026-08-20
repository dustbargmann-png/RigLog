"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

async function uploadPhotoIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  unitId: string,
  formData: FormData,
): Promise<string | null> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;

  const ext = photo.name.split(".").pop() || "jpg";
  const path = `${companyId}/${unitId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("photos").upload(path, photo, {
    contentType: photo.type,
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

export async function createUnit(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const yearRaw = formData.get("year") as string;

  const { data: unit, error } = await supabase
    .from("units")
    .insert({
      company_id: user.companyId,
      created_by: user.id,
      label: formData.get("label") as string,
      unit_type: (formData.get("unit_type") as string) || null,
      make: (formData.get("make") as string) || null,
      model: (formData.get("model") as string) || null,
      vin: (formData.get("vin") as string) || null,
      year: yearRaw ? parseInt(yearRaw, 10) : null,
      notes: (formData.get("notes") as string) || null,
    })
    .select("id")
    .single();

  if (error || !unit) {
    redirect(`/units/new?error=${encodeURIComponent(error?.message ?? "Could not create unit")}`);
  }

  if (user.role !== "admin") {
    await supabase.from("unit_assignments").insert({ unit_id: unit.id, user_id: user.id });
  }

  const photoUrl = await uploadPhotoIfPresent(supabase, user.companyId, unit.id, formData);
  if (photoUrl) {
    await supabase.from("units").update({ photo_url: photoUrl }).eq("id", unit.id);
  }

  revalidatePath("/units");
  redirect(`/units/${unit.id}`);
}

export async function updateUnit(unitId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const yearRaw = formData.get("year") as string;
  const photoUrl = await uploadPhotoIfPresent(supabase, user.companyId, unitId, formData);

  const { error } = await supabase
    .from("units")
    .update({
      label: formData.get("label") as string,
      unit_type: (formData.get("unit_type") as string) || null,
      make: (formData.get("make") as string) || null,
      model: (formData.get("model") as string) || null,
      vin: (formData.get("vin") as string) || null,
      year: yearRaw ? parseInt(yearRaw, 10) : null,
      notes: (formData.get("notes") as string) || null,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq("id", unitId);

  if (error) {
    redirect(`/units/${unitId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/units");
  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}`);
}

export async function deleteUnit(unitId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  await supabase.from("units").delete().eq("id", unitId);

  revalidatePath("/units");
  redirect("/units");
}
