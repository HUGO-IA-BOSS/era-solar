"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PLAN } from "@/lib/plan-template";

// Genera las etapas/tareas/checklist del proyecto a partir de la plantilla estándar.
// Solo si el proyecto aún no tiene etapas.
export async function generarPlan(projectId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("project_stages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) > 0) {
    revalidatePath(`/app/proyectos/${projectId}/plan`);
    return;
  }

  for (let si = 0; si < DEFAULT_PLAN.length; si++) {
    const st = DEFAULT_PLAN[si];
    const { data: stage } = await supabase
      .from("project_stages")
      .insert({ project_id: projectId, nombre: st.nombre, orden: si })
      .select("id")
      .single();
    if (!stage) continue;

    for (let ti = 0; ti < st.tasks.length; ti++) {
      const t = st.tasks[ti];
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          stage_id: stage.id,
          titulo: t.titulo,
          descripcion: t.descripcion ?? null,
          opcional: !!t.opcional,
          estado: t.estado ?? "pendiente",
          orden: ti,
        })
        .select("id")
        .single();
      if (task && t.checklist?.length) {
        await supabase.from("task_checklist_items").insert(
          t.checklist.map((c, ci) => ({
            task_id: task.id,
            label: c.label,
            tipo: c.tipo,
            opcional: !!c.opcional,
            orden: ci,
          }))
        );
      }
    }
  }

  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
}
