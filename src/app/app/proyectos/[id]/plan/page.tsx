import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/ui";
import { theme } from "@/lib/theme";
import type { Project, ProjectStage, Task, TaskChecklistItem } from "@/lib/types";
import PlanWorkspace from "./_components/PlanWorkspace";

export const dynamic = "force-dynamic";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("id, nombre").eq("id", id).single<Pick<Project, "id" | "nombre">>();
  if (!project) notFound();

  const [{ data: stages }, { data: tasks }, { data: users }] = await Promise.all([
    supabase.from("project_stages").select("*").eq("project_id", id).order("orden"),
    supabase.from("tasks").select("*").eq("project_id", id).order("orden"),
    supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
  ]);

  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: checklist } = taskIds.length
    ? await supabase.from("task_checklist_items").select("*").in("task_id", taskIds).order("orden")
    : { data: [] as TaskChecklistItem[] };

  return (
    <div>
      <Link
        href={`/app/proyectos/${id}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.textMuted, fontSize: 13, textDecoration: "none", marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> {project.nombre}
      </Link>

      <PageHeader title="Plan del proyecto" subtitle="Etapas, tareas y checklist" />

      <PlanWorkspace
        projectId={id}
        stages={(stages ?? []) as ProjectStage[]}
        tasks={(tasks ?? []) as Task[]}
        checklist={(checklist ?? []) as TaskChecklistItem[]}
        users={users ?? []}
      />
    </div>
  );
}
