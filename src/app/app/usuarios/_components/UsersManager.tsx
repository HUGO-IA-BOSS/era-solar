"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { UserPlus, X } from "lucide-react";
import { theme, inputStyle, btnPrimary } from "@/lib/theme";
import { ROLES, ROLE_MAP } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";
import { inviteUser, setUserRole, removeInvite } from "../actions";

function InviteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
      <UserPlus size={16} /> {pending ? "Invitando…" : "Invitar"}
    </button>
  );
}

export default function UsersManager({
  members,
  pending,
  meId,
}: {
  members: Profile[];
  pending: { email: string; role: Role; created_at: string }[];
  meId: string;
}) {
  const [busy, start] = useTransition();
  const router = useRouter();

  function changeRole(p: Profile, role: Role) {
    start(async () => {
      await setUserRole(p.id, p.email, role);
      router.refresh();
    });
  }
  function dropInvite(email: string) {
    start(async () => {
      await removeInvite(email);
      router.refresh();
    });
  }

  const roleSelect = (current: Role, disabled: boolean, onChange: (r: Role) => void) => (
    <select
      value={current}
      disabled={disabled || busy}
      onChange={(e) => onChange(e.target.value as Role)}
      style={{ ...inputStyle, width: "auto", appearance: "auto", padding: "7px 10px", opacity: disabled ? 0.5 : 1 }}
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value} style={{ background: theme.surfaceSolid }}>
          {r.label}
        </option>
      ))}
    </select>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26, opacity: busy ? 0.85 : 1 }}>
      {/* Invitar */}
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Invitar a alguien</h2>
        <form action={inviteUser} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input name="email" type="email" required placeholder="correo@gmail.com" style={{ ...inputStyle, flex: 1, minWidth: 220 }} />
          <select name="role" defaultValue="tecnico" style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
            {ROLES.filter((r) => r.value !== "pendiente").map((r) => (
              <option key={r.value} value={r.value} style={{ background: theme.surfaceSolid }}>
                {r.label}
              </option>
            ))}
          </select>
          <InviteSubmit />
        </form>
        <p style={{ fontSize: 12.5, color: theme.textFaint, margin: "12px 0 0" }}>
          La persona podrá entrar con “Continuar con Google” usando ese correo. El acceso se activa apenas inicie sesión.
        </p>
      </div>

      {/* Miembros */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Equipo ({members.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                background: theme.surface,
              }}
            >
              <Avatar p={m} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {m.full_name || m.email}
                  {m.id === meId && <span style={{ color: theme.textFaint, fontWeight: 400 }}> (tú)</span>}
                </div>
                <div style={{ fontSize: 12.5, color: theme.textFaint }}>{m.email}</div>
              </div>
              {roleSelect(m.role, m.id === meId, (r) => changeRole(m, r))}
            </div>
          ))}
        </div>
      </div>

      {/* Invitaciones pendientes */}
      {pending.length > 0 && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Invitaciones pendientes ({pending.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map((inv) => (
              <div
                key={inv.email}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  border: `1px dashed ${theme.border}`,
                  borderRadius: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontSize: 12.5, color: theme.textFaint }}>Aún no inicia sesión · rol {ROLE_MAP[inv.role]}</div>
                </div>
                <button onClick={() => dropInvite(inv.email)} disabled={busy} title="Cancelar invitación" style={{ background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, width: 34, height: 34, display: "grid", placeItems: "center", color: "#fca5a5", cursor: "pointer" }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ p }: { p: Profile }) {
  if (p.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatar_url} alt="" width={36} height={36} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} referrerPolicy="no-referrer" />;
  }
  const initials = (p.full_name || p.email).split(/[\s@.]+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  return (
    <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: theme.surfaceHover, fontSize: 13, fontWeight: 700 }}>
      {initials}
    </span>
  );
}
