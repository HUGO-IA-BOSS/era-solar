"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { defaultStoredTemplate, type StoredStage } from "@/lib/plan-template";

type DB = Awaited<ReturnType<typeof createClient>>;

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}

async function getTemplate(supabase: DB): Promise<StoredStage[]> {
  const { data } = await supabase.from("plan_template").select("data").eq("id", 1).maybeSingle();
  const stored = data?.data as StoredStage[] | undefined;
  return stored && stored.length ? stored : defaultStoredTemplate();
}

// Crea etapas/tareas/checklist desde la plantilla (claves estables), resolviendo
// dependencias de etapa y tarea, e inventando fechas si llegan fechas de inicio por etapa.
async function seedPlan(supabase: DB, projectId: string, template: StoredStage[], fechas?: (string | null)[]) {
  // Ventana de fechas por etapa (índice = orden)
  const starts: (string | null)[] = [];
  const ends: (string | null)[] = [];
  for (let i = 0; i < template.length; i++) {
    const start = fechas?.[i] || null;
    let end: string | null = null;
    if (start) {
      let nextStart: string | null = null;
      for (let k = i + 1; k < template.length; k++) {
        if (fechas?.[k]) {
          nextStart = fechas[k]!;
          break;
        }
      }
      end = nextStart && dayDiff(start, nextStart) > 0 ? nextStart : addDays(start, 7);
    }
    starts.push(start);
    ends.push(end);
  }

  // Pass 1: etapas
  const stageIdByKey = new Map<string, string>();
  for (let i = 0; i < template.length; i++) {
    const st = template[i];
    const { data: stage } = await supabase
      .from("project_stages")
      .insert({ project_id: projectId, nombre: st.nombre, orden: i, fecha_inicio: starts[i], fecha_fin: ends[i] })
      .select("id")
      .single();
    if (stage) stageIdByKey.set(st.key, stage.id);
  }
  // Pass 2: dependencias de etapa
  for (const st of template) {
    if (!st.dependsOnStageKey) continue;
    const id = stageIdByKey.get(st.key);
    const dep = stageIdByKey.get(st.dependsOnStageKey);
    if (id && dep) await supabase.from("project_stages").update({ depends_on_stage_id: dep }).eq("id", id);
  }

  // Pass 3: tareas + checklist
  const taskIdByKey = new Map<string, string>();
  for (let i = 0; i < template.length; i++) {
    const st = template[i];
    const stageId = stageIdByKey.get(st.key);
    if (!stageId) continue;
    const start = starts[i];
    const end = ends[i];
    const N = st.tasks.length || 1;
    const span = start && end ? Math.max(1, dayDiff(start, end)) : 0;
    for (let j = 0; j < st.tasks.length; j++) {
      const t = st.tasks[j];
      let tStart: string | null = null;
      let tLimite: string | null = null;
      if (start) {
        const a = Math.floor((j * span) / N);
        const b = Math.floor(((j + 1) * span) / N);
        tStart = addDays(start, a);
        tLimite = addDays(start, Math.max(a, b));
      }
      const { data: task } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          stage_id: stageId,
          titulo: t.titulo,
          descripcion: t.descripcion ?? null,
          opcional: !!t.opcional,
          estado: t.estado ?? "pendiente",
          orden: j,
          fecha_inicio: tStart,
          fecha_limite: tLimite,
        })
        .select("id")
        .single();
      if (!task) continue;
      taskIdByKey.set(t.key, task.id);
      if (t.checklist?.length) {
        await supabase.from("task_checklist_items").insert(
          t.checklist.map((c, ci) => ({ task_id: task.id, label: c.label, tipo: c.tipo, opcional: !!c.opcional, orden: ci }))
        );
      }
    }
  }
  // Pass 4: dependencias de tarea
  for (const st of template) {
    for (const t of st.tasks) {
      if (!t.dependsOnTaskKey) continue;
      const id = taskIdByKey.get(t.key);
      const dep = taskIdByKey.get(t.dependsOnTaskKey);
      if (id && dep) await supabase.from("tasks").update({ depends_on_task_id: dep }).eq("id", id);
    }
  }
}

// Genera el plan solo si el proyecto aún no tiene etapas.
export async function generarPlan(projectId: string, fechas?: (string | null)[]) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("project_stages")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if ((count ?? 0) === 0) {
    const template = await getTemplate(supabase);
    await seedPlan(supabase, projectId, template, fechas);
  }
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
}

// Borra el plan actual y lo recrea desde la plantilla.
export async function regenerarPlan(projectId: string, fechas?: (string | null)[]) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("project_id", projectId); // cascade => checklist
  await supabase.from("project_stages").delete().eq("project_id", projectId);
  const template = await getTemplate(supabase);
  await seedPlan(supabase, projectId, template, fechas);
  revalidatePath(`/app/proyectos/${projectId}/plan`);
  revalidatePath(`/app/proyectos/${projectId}`);
}
