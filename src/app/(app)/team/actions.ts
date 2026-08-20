"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export async function regenerateInviteCode() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/team");

  const supabase = await createClient();
  const newCode = randomBytes(6).toString("hex");

  await supabase.from("companies").update({ invite_code: newCode }).eq("id", user.companyId);

  revalidatePath("/team");
  redirect("/team");
}

export async function saveUnitAssignments(targetUserId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/team");

  const supabase = await createClient();

  const { data: allUnits } = await supabase.from("units").select("id");
  const checkedUnitIds = new Set(formData.getAll("unit_id") as string[]);

  const { data: existing } = await supabase
    .from("unit_assignments")
    .select("id, unit_id")
    .eq("user_id", targetUserId);

  const existingUnitIds = new Set((existing ?? []).map((a) => a.unit_id));

  const toRemove = (existing ?? []).filter((a) => !checkedUnitIds.has(a.unit_id)).map((a) => a.id);
  const toAdd = (allUnits ?? [])
    .filter((u) => checkedUnitIds.has(u.id) && !existingUnitIds.has(u.id))
    .map((u) => ({ unit_id: u.id, user_id: targetUserId }));

  if (toRemove.length > 0) {
    await supabase.from("unit_assignments").delete().in("id", toRemove);
  }
  if (toAdd.length > 0) {
    await supabase.from("unit_assignments").insert(toAdd);
  }

  revalidatePath(`/team/${targetUserId}`);
  redirect("/team");
}
