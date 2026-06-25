import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import { theme } from "@/lib/theme";
import { defaultStoredTemplate, type StoredStage } from "@/lib/plan-template";
import type { Role } from "@/lib/types";
import PlantillaEditor from "./_components/PlantillaEditor";

export const dynamic = "force-dynamic";

export default async function PlantillaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single<{ role: Role }>();

  if (me?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Plantilla de plan" />
        <p style={{ color: theme.textMuted }}>Solo los administradores pueden editar la plantilla.</p>
      </div>
    );
  }

  const { data: row } = await supabase.from("plan_template").select("data").eq("id", 1).maybeSingle();
  const initial = ((row?.data as StoredStage[] | undefined) ?? defaultStoredTemplate());

  return (
    <div>
      <PageHeader
        title="Plantilla de plan"
        subtitle="Define las etapas, tareas y dependencias que se usan al generar el plan de un proyecto"
      />
      <PlantillaEditor initial={initial} />
    </div>
  );
}
