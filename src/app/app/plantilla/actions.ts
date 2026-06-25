"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTemplate, type StoredStage } from "@/lib/plan-template";

export async function savePlantilla(data: StoredStage[]): Promise<{ error?: string }> {
  const errors = validateTemplate(data);
  if (errors.length) return { error: errors.join(" · ") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("plan_template")
    .upsert({ id: 1, data, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  revalidatePath("/app/plantilla");
  return {};
}
