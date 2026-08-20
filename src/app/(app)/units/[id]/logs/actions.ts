"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

async function uploadPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string,
  unitId: string,
  logId: string,
  formData: FormData,
): Promise<string[]> {
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const urls: string[] = [];

  for (const [index, file] of files.entries()) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${companyId}/${unitId}/logs/${logId}/${Date.now()}-${index}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, {
      contentType: file.type,
    });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    urls.push(supabase.storage.from("photos").getPublicUrl(path).data.publicUrl);
  }

  return urls;
}

export async function createInspectionLog(unitId: string, templateId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("template_id", templateId);

  const { data: log, error } = await supabase
    .from("inspection_logs")
    .insert({
      unit_id: unitId,
      company_id: user.companyId,
      template_id: templateId,
      performed_by: user.id,
      notes: (formData.get("notes") as string) || null,
      overall_status: (formData.get("overall_status") as string) || "pass",
    })
    .select("id")
    .single();

  if (error || !log) {
    redirect(
      `/units/${unitId}/inspect/${templateId}?error=${encodeURIComponent(error?.message ?? "Could not save inspection")}`,
    );
  }

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from("inspection_log_items").insert(
      items.map((item) => ({
        inspection_log_id: log.id,
        checklist_item_id: item.id,
        response: (formData.get(`item_${item.id}`) as string) || null,
      })),
    );
    if (itemsError) {
      redirect(
        `/units/${unitId}/inspect/${templateId}?error=${encodeURIComponent(itemsError.message)}`,
      );
    }
  }

  const photoUrls = await uploadPhotos(supabase, user.companyId, unitId, log.id, formData);
  if (photoUrls.length > 0) {
    const { error: photosError } = await supabase
      .from("inspection_log_photos")
      .insert(photoUrls.map((photo_url) => ({ inspection_log_id: log.id, photo_url })));
    if (photosError) {
      redirect(`/units/${unitId}/logs/${log.id}?error=${encodeURIComponent(photosError.message)}`);
    }
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}/logs/${log.id}`);
}

export async function createServiceLog(unitId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const inventoryItemId = (formData.get("inventory_item_id") as string) || null;

  const { data: log, error } = await supabase
    .from("inspection_logs")
    .insert({
      unit_id: unitId,
      company_id: user.companyId,
      inventory_item_id: inventoryItemId,
      performed_by: user.id,
      notes: (formData.get("notes") as string) || null,
      overall_status: (formData.get("overall_status") as string) || "pass",
    })
    .select("id")
    .single();

  if (error || !log) {
    redirect(
      `/units/${unitId}/service/new?error=${encodeURIComponent(error?.message ?? "Could not save service log")}`,
    );
  }

  const photoUrls = await uploadPhotos(supabase, user.companyId, unitId, log.id, formData);
  if (photoUrls.length > 0) {
    const { error: photosError } = await supabase
      .from("inspection_log_photos")
      .insert(photoUrls.map((photo_url) => ({ inspection_log_id: log.id, photo_url })));
    if (photosError) {
      redirect(`/units/${unitId}/logs/${log.id}?error=${encodeURIComponent(photosError.message)}`);
    }
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}/logs/${log.id}`);
}

export async function deleteLog(unitId: string, logId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("inspection_logs").delete().eq("id", logId);

  if (error) {
    redirect(`/units/${unitId}/logs/${logId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/units/${unitId}`);
  redirect(`/units/${unitId}`);
}
