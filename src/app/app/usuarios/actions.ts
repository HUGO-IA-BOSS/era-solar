"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

// Las RLS exigen is_admin() para tocar allowed_emails y cambiar roles.

export async function inviteUser(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = (String(formData.get("role") ?? "tecnico") as Role) || "tecnico";
  if (!email || !email.includes("@")) return;
  const supabase = await createClient();
  await supabase.from("allowed_emails").upsert({ email, role });
  // Si ya tenía cuenta (estaba pendiente), darle el rol de inmediato.
  await supabase.from("profiles").update({ role }).ilike("email", email);
  revalidatePath("/app/usuarios");
}

export async function setUserRole(profileId: string, email: string, role: Role) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (role === "pendiente") {
    await supabase.from("allowed_emails").delete().ilike("email", email.toLowerCase());
  } else {
    await supabase.from("allowed_emails").upsert({ email: email.toLowerCase(), role });
  }
  revalidatePath("/app/usuarios");
}

export async function revokeUser(profileId: string, email: string) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ role: "pendiente" }).eq("id", profileId);
  await supabase.from("allowed_emails").delete().ilike("email", email.toLowerCase());
  revalidatePath("/app/usuarios");
}

export async function removeInvite(email: string) {
  const supabase = await createClient();
  await supabase.from("allowed_emails").delete().ilike("email", email.toLowerCase());
  revalidatePath("/app/usuarios");
}
