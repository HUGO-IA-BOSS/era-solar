import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import { theme } from "@/lib/theme";
import type { Sociedad, Role } from "@/lib/types";
import SociedadesManager from "./_components/SociedadesManager";

export const dynamic = "force-dynamic";

export default async function SociedadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single<{ role: Role }>();

  if (me?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Sociedades" />
        <p style={{ color: theme.textMuted }}>Solo los administradores pueden gestionar las sociedades.</p>
      </div>
    );
  }

  const { data } = await supabase.from("sociedades").select("*").order("created_at", { ascending: true });

  return (
    <div>
      <PageHeader title="Sociedades" subtitle="Empresas para imputar fondos, facturas y gastos" />
      <SociedadesManager sociedades={(data ?? []) as Sociedad[]} />
    </div>
  );
}
