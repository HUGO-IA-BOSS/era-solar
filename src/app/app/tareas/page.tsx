import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import type { Task } from "@/lib/types";
import TareasBoard from "./_components/TareasBoard";

export const dynamic = "force-dynamic";

export default async function TareasPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: projects }, { data: stages }, { data: users }] = await Promise.all([
    supabase.from("tasks").select("*").neq("estado", "hecha").order("fecha_limite", { ascending: true, nullsFirst: false }),
    supabase.from("projects").select("id, nombre"),
    supabase.from("project_stages").select("id, nombre"),
    supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
  ]);

  return (
    <div>
      <PageHeader title="Tareas" subtitle="Todo lo pendiente, en todos los proyectos" />
      <TareasBoard
        tasks={(tasks ?? []) as Task[]}
        projects={projects ?? []}
        stages={stages ?? []}
        users={users ?? []}
      />
    </div>
  );
}
