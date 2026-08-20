"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";

export async function createTemplate(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const intervalRaw = formData.get("interval_days") as string;

  const { data: template, error } = await supabase
    .from("checklist_templates")
    .insert({
      company_id: user.companyId,
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      interval_days: intervalRaw ? parseInt(intervalRaw, 10) : 365,
    })
    .select("id")
    .single();

  if (error || !template) {
    redirect(`/checklists/new?error=${encodeURIComponent(error?.message ?? "Could not create template")}`);
  }

  revalidatePath("/checklists");
  redirect(`/checklists/${template.id}`);
}

export async function updateTemplate(templateId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const intervalRaw = formData.get("interval_days") as string;

  const { error } = await supabase
    .from("checklist_templates")
    .update({
      name: formData.get("name") as string,
      category: (formData.get("category") as string) || null,
      interval_days: intervalRaw ? parseInt(intervalRaw, 10) : 365,
    })
    .eq("id", templateId);

  if (error) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${templateId}`);
  redirect(`/checklists/${templateId}`);
}

export async function deleteTemplate(templateId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("checklist_templates").delete().eq("id", templateId);

  if (error) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/checklists");
  redirect("/checklists");
}

export async function forkTemplate(templateId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: source } = await supabase
    .from("checklist_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (!source) redirect("/checklists");

  const { data: sourceItems } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true });

  const { data: fork, error } = await supabase
    .from("checklist_templates")
    .insert({
      company_id: user.companyId,
      name: source.name,
      category: source.category,
      interval_days: source.interval_days,
      forked_from_id: source.id,
    })
    .select("id")
    .single();

  if (error || !fork) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error?.message ?? "Could not fork template")}`);
  }

  if (sourceItems && sourceItems.length > 0) {
    const { error: itemsError } = await supabase.from("checklist_items").insert(
      sourceItems.map((item) => ({
        template_id: fork.id,
        label: item.label,
        sort_order: item.sort_order,
        response_type: item.response_type,
        is_required: item.is_required,
      })),
    );
    if (itemsError) {
      redirect(`/checklists/${fork.id}?error=${encodeURIComponent(itemsError.message)}`);
    }
  }

  revalidatePath("/checklists");
  redirect(`/checklists/${fork.id}`);
}

export async function addChecklistItem(templateId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: maxRow } = await supabase
    .from("checklist_items")
    .select("sort_order")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("checklist_items").insert({
    template_id: templateId,
    label: formData.get("label") as string,
    response_type: (formData.get("response_type") as string) || "pass_fail",
    is_required: formData.get("is_required") === "on",
    sort_order: (maxRow?.sort_order ?? 0) + 1,
  });

  if (error) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/checklists/${templateId}`);
  redirect(`/checklists/${templateId}`);
}

export async function updateChecklistItem(templateId: string, itemId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const sortRaw = formData.get("sort_order") as string;

  const { error } = await supabase
    .from("checklist_items")
    .update({
      label: formData.get("label") as string,
      response_type: (formData.get("response_type") as string) || "pass_fail",
      is_required: formData.get("is_required") === "on",
      ...(sortRaw ? { sort_order: parseInt(sortRaw, 10) } : {}),
    })
    .eq("id", itemId);

  if (error) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/checklists/${templateId}`);
  redirect(`/checklists/${templateId}`);
}

export async function deleteChecklistItem(templateId: string, itemId: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("checklist_items").delete().eq("id", itemId);

  if (error) {
    redirect(`/checklists/${templateId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/checklists/${templateId}`);
  redirect(`/checklists/${templateId}`);
}
