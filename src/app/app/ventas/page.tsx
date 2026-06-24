import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import type { Sale, SaleAllocation } from "@/lib/types";
import VentasManager from "./_components/VentasManager";

export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const supabase = await createClient();

  const [{ data: sales }, { data: allocations }, { data: projects }, { data: users }, { data: sociedades }] =
    await Promise.all([
      supabase.from("sales").select("*").order("fecha_pago", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      supabase.from("sale_allocations").select("*"),
      supabase.from("projects").select("id, nombre").order("nombre"),
      supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
      supabase.from("sociedades").select("id").limit(1),
    ]);

  return (
    <div>
      <PageHeader title="Ventas" subtitle="Ingresos y pagos de proyectos" />
      <VentasManager
        sales={(sales ?? []) as Sale[]}
        allocations={(allocations ?? []) as SaleAllocation[]}
        projects={projects ?? []}
        users={users ?? []}
        sociedadId={sociedades?.[0]?.id ?? null}
      />
    </div>
  );
}
