import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Design } from "@/lib/types";
import EditorClient from "./EditorClient";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string; designId: string }>;
}) {
  const { id, designId } = await params;
  const supabase = await createClient();

  const { data: design } = await supabase
    .from("designs")
    .select("*")
    .eq("id", designId)
    .single<Design>();
  if (!design) notFound();

  const { data: project } = await supabase.from("projects").select("nombre").eq("id", id).single();

  return (
    <EditorClient design={design} projectId={id} projectName={project?.nombre ?? "Proyecto"} />
  );
}
