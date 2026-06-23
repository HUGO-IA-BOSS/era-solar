import { redirect } from "next/navigation";
import { Inter, Space_Grotesk } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { theme } from "@/lib/theme";
import type { Profile } from "@/lib/types";
import Shell from "./_components/Shell";
import { signOut } from "@/app/auth/actions";
import "./app.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata = {
  title: "Era Solar — Backoffice",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div className={`es-app ${inter.variable} ${grotesk.variable}`}>
      {!profile || profile.role === "pendiente" ? (
        <NoAccess email={user.email ?? ""} />
      ) : (
        <Shell profile={profile}>{children}</Shell>
      )}
    </div>
  );
}

function NoAccess({ email }: { email: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: theme.bg,
        color: theme.text,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 440 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Acceso pendiente</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Tu cuenta <strong>{email}</strong> aún no está autorizada para entrar al
          backoffice de Era Solar. Pídele a un administrador que te dé acceso desde la
          sección de Usuarios.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
