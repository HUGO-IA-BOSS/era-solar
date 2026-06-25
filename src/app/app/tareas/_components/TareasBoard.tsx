"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle } from "@/lib/theme";
import { ESTADO_TAREA_MAP } from "@/lib/constants";
import { EmptyState } from "../../_components/ui";
import type { Task } from "@/lib/types";

type Mini = { id: string; nombre: string };
type MiniUser = { id: string; full_name: string | null; email: string };

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) : "—";

export default function TareasBoard({
  tasks,
  projects,
  stages,
  users,
}: {
  tasks: Task[];
  projects: Mini[];
  stages: Mini[];
  users: MiniUser[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fProyecto, setFProyecto] = useState("");
  const [fResponsable, setFResponsable] = useState("");
  const [soloVencidas, setSoloVencidas] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.nombre])), [projects]);
  const stageMap = useMemo(() => new Map(stages.map((s) => [s.id, s.nombre])), [stages]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name || u.email])), [users]);

  const hoy = new Date().toISOString().slice(0, 10);
  const filtered = tasks.filter((t) => {
    if (fProyecto && t.project_id !== fProyecto) return false;
    if (fResponsable === "sin" && t.responsable_id) return false;
    if (fResponsable && fResponsable !== "sin" && t.responsable_id !== fResponsable) return false;
    if (soloVencidas && !(t.fecha_limite && t.fecha_limite < hoy)) return false;
    return true;
  });

  async function marcarHecha(t: Task) {
    setBusy(true);
    await supabase.from("tasks").update({ estado: "hecha", completed_at: new Date().toISOString() }).eq("id", t.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ opacity: busy ? 0.7 : 1 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <select value={fProyecto} onChange={(e) => setFProyecto(e.target.value)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
          <option value="" style={{ background: theme.surfaceSolid }}>Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} style={{ background: theme.surfaceSolid }}>{p.nombre}</option>
          ))}
        </select>
        <select value={fResponsable} onChange={(e) => setFResponsable(e.target.value)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
          <option value="" style={{ background: theme.surfaceSolid }}>Todos los responsables</option>
          <option value="sin" style={{ background: theme.surfaceSolid }}>Sin asignar</option>
          {users.map((u) => (
            <option key={u.id} value={u.id} style={{ background: theme.surfaceSolid }}>{u.full_name || u.email}</option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: theme.textMuted, cursor: "pointer" }}>
          <input type="checkbox" checked={soloVencidas} onChange={(e) => setSoloVencidas(e.target.checked)} /> Solo vencidas
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nada pendiente" description="No hay tareas abiertas con esos filtros." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => {
            const est = ESTADO_TAREA_MAP[t.estado];
            const vencida = t.fecha_limite && t.fecha_limite < hoy;
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface, flexWrap: "wrap" }}>
                <button onClick={() => marcarHecha(t)} title="Marcar hecha" style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textFaint, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Check size={14} />
                </button>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: est.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.titulo}</div>
                  <div style={{ fontSize: 12, color: theme.textFaint }}>
                    <Link href={`/app/proyectos/${t.project_id}/plan`} style={{ color: theme.textMuted, textDecoration: "none" }}>
                      {projectMap.get(t.project_id) ?? "Proyecto"}
                    </Link>
                    {t.stage_id && stageMap.get(t.stage_id) && ` · ${stageMap.get(t.stage_id)}`}
                  </div>
                </div>
                {t.responsable_id && <span style={{ fontSize: 12.5, color: theme.textMuted }}>{userMap.get(t.responsable_id) ?? ""}</span>}
                <span style={{ fontSize: 12.5, color: vencida ? theme.danger : theme.textMuted, fontWeight: vencida ? 700 : 400 }}>{fmt(t.fecha_limite)}</span>
                <span style={{ fontSize: 11.5, color: est.color, fontWeight: 600 }}>{est.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
