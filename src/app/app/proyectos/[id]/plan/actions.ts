"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PLAN } from "@/lib/plan-template";

type DB = Awaited<ReturnType<typeof createClient>>;

// Inserta etapas/tareas/checklist desde la plantilla, resolviendo dependencias
// de etapa (bloqueadaPor) y de tarea (dependeDe).
async function seedPlan(supabase: DB, projectId: string) {
  const stageIdByName = new Map<string, string>();
  const taskIdByTitulo = new Map<string, string>();

  for (let si = 0; si < DEFAULT_PLAN.length; si++) {
    const st = DEFAULT_PLAN[si];
    const stageDep = st.bloqueadaPor ? stageIdByName.get(st.bloqueadaPor) ?? null : null;
    const { data: stage } = await supabase
      .from("project_stages")
      .insert({ project_id: projectId, nombre: st.nombre, orden: si, depends_on_stage_id: stageDep })
      .select("id")
      .single();
    if (!stage) continue;
    stageIdByName.set(st.nombre, stage.id);

    for (let ti = 0; ti < st.tasks.length; ti++) {
      const t = st.tasks[ti];
      const taskDep = t.dependeDe ? taskIdByTitulo.get(t.dependeDe) ?? null : null;
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
          depends_on_task_id: taskDep,
        })
        .select("id")
        .single();
      if (task) taskIdByTitulo.set(t.titulo, task.id);
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
}

// Genera el plan estándar solo si el proyecto aún no tiene etapas.
export async function generarPlan(projectId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_stages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) === 0) await seedPlan(supabase, projectId);
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
}

// Borra el plan actual del proyecto y lo recrea desde la plantilla.
export async function regenerarPlan(projectId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("project_id", projectId); // cascade => checklist
  await supabase.from("project_stages").delete().eq("project_id", projectId);
  await seedPlan(supabase, projectId);
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
}
