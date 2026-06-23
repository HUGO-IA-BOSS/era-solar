import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../_components/ui";
import { theme } from "@/lib/theme";
import type { Profile, Role } from "@/lib/types";
import UsersManager from "./_components/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single<{ role: Role }>();

  if (me?.role !== "admin") {
    return (
      <div>
        <PageHeader title="Usuarios" />
        <p style={{ color: theme.textMuted }}>Solo los administradores pueden gestionar usuarios.</p>
      </div>
    );
  }

  const [{ data: profiles }, { data: allowed }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: true }),
    supabase.from("allowed_emails").select("*").order("created_at", { ascending: true }),
  ]);

  const members = (profiles ?? []) as Profile[];
  const registered = new Set(members.map((m) => m.email.toLowerCase()));
  const pending = ((allowed ?? []) as { email: string; role: Role; created_at: string }[]).filter(
    (a) => !registered.has(a.email.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Usuarios" subtitle="Gestiona el acceso y los roles del equipo" />
      <UsersManager members={members} pending={pending} meId={user!.id} />
    </div>
  );
}
