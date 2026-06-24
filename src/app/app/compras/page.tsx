import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import type { Purchase } from "@/lib/types";
import ComprasManager from "./_components/ComprasManager";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const supabase = await createClient();

  const [{ data: purchases }, { data: projects }, { data: users }, { data: sociedades }] = await Promise.all([
    supabase.from("purchases").select("*").order("fecha_compra", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, nombre").order("nombre"),
    supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
    supabase.from("sociedades").select("id").limit(1),
  ]);

  const sociedadId = sociedades?.[0]?.id ?? null;

  return (
    <div>
      <PageHeader title="Compras" subtitle="Gastos y compras de la empresa" />
      <ComprasManager
        purchases={(purchases ?? []) as Purchase[]}
        projects={projects ?? []}
        users={users ?? []}
        sociedadId={sociedadId}
      />
    </div>
  );
}
