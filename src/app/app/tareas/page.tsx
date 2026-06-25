import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import type { Task, ProjectStage } from "@/lib/types";
import TareasBoard from "./_components/TareasBoard";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const supabase = await createClient();

  // Traemos TODAS las tareas y etapas (con sus dependencias) para poder calcular
  // qué tareas están bloqueadas y ocultarlas; la bandeja muestra solo lo accionable.
  const [{ data: tasks }, { data: projects }, { data: stages }, { data: users }] = await Promise.all([
    supabase.from("tasks").select("*").order("fecha_limite", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("id, nombre"),
    supabase.from("project_stages").select("*"),
    supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
  ]);

  return (
    <div>
      <PageHeader title="Tareas" subtitle="Lo accionable, en todos los proyectos" />
      <TareasBoard
        tasks={(tasks ?? []) as Task[]}
        projects={projects ?? []}
        stages={(stages ?? []) as ProjectStage[]}
        users={users ?? []}
      />
    </div>
  );
}
