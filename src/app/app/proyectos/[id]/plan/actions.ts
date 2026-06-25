"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PLAN } from "@/lib/plan-template";

type DB = Awaited<ReturnType<typeof createClient>>;

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

// Inserta etapas/tareas/checklist desde la plantilla, resolviendo dependencias
// (bloqueadaPor / dependeDe) y, si llegan fechas de inicio por etapa, inventa
// las fechas de etapas y tareas para poblar el Gantt.
async function seedPlan(supabase: DB, projectId: string, fechas?: (string | null)[]): Promise<string | null> {
  const stageIdByName = new Map<string, string>();
  const taskIdByTitulo = new Map<string, string>();

  for (let si = 0; si < DEFAULT_PLAN.length; si++) {
    const st = DEFAULT_PLAN[si];
    const stageDep = st.bloqueadaPor ? stageIdByName.get(st.bloqueadaPor) ?? null : null;

    const start = fechas?.[si] || null;
    let end: string | null = null;
    if (start) {
      let nextStart: string | null = null;
      for (let k = si + 1; k < DEFAULT_PLAN.length; k++) {
        if (fechas?.[k]) {
          nextStart = fechas[k]!;
          break;
        }
      }
      end = nextStart && dayDiff(start, nextStart) > 0 ? nextStart : addDays(start, 7);
    }

    const { data: stage, error: stageErr } = await supabase
      .from("project_stages")
      .insert({ project_id: projectId, nombre: st.nombre, orden: si, depends_on_stage_id: stageDep, fecha_inicio: start, fecha_fin: end })
      .select("id")
      .single();
    if (stageErr) return `Etapas: ${stageErr.message}`;
    if (!stage) continue;
    stageIdByName.set(st.nombre, stage.id);

    const N = st.tasks.length;
    const span = start && end ? Math.max(1, dayDiff(start, end)) : 0;

    for (let ti = 0; ti < st.tasks.length; ti++) {
      const t = st.tasks[ti];
      const taskDep = t.dependeDe ? taskIdByTitulo.get(t.dependeDe) ?? null : null;
      let tStart: string | null = null;
      let tLimite: string | null = null;
      if (start) {
        const a = Math.floor((ti * span) / N);
        const b = Math.floor(((ti + 1) * span) / N);
        tStart = addDays(start, a);
        tLimite = addDays(start, Math.max(a, b));
      }
      const { data: task, error: taskErr } = await supabase
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
          fecha_inicio: tStart,
          fecha_limite: tLimite,
        })
        .select("id")
        .single();
      if (taskErr) return `Tareas: ${taskErr.message}`;
      if (task) taskIdByTitulo.set(t.titulo, task.id);
      if (task && t.checklist?.length) {
        const { error: clErr } = await supabase.from("task_checklist_items").insert(
          t.checklist.map((c, ci) => ({ task_id: task.id, label: c.label, tipo: c.tipo, opcional: !!c.opcional, orden: ci }))
        );
        if (clErr) return `Checklist: ${clErr.message}`;
      }
    }
  }
  return null;
}

// Genera el plan estándar solo si el proyecto aún no tiene etapas.
export async function generarPlan(projectId: string, fechas?: (string | null)[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_stages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) === 0) {
    const err = await seedPlan(supabase, projectId, fechas);
    if (err) return { error: err };
  }
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
  return {};
}

// Borra el plan actual del proyecto y lo recrea desde la plantilla.
export async function regenerarPlan(projectId: string, fechas?: (string | null)[]): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error: delTasks } = await supabase.from("tasks").delete().eq("project_id", projectId); // cascade => checklist
  if (delTasks) return { error: `Borrando tareas: ${delTasks.message}` };
  const { error: delStages } = await supabase.from("project_stages").delete().eq("project_id", projectId);
  if (delStages) return { error: `Borrando etapas: ${delStages.message}` };
  const err = await seedPlan(supabase, projectId, fechas);
  if (err) return { error: err };
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
  return {};
}
