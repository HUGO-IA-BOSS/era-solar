"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Lock } from "lucide-react";
import Modal from "../../_components/Modal";
import { EmptyState } from "../../_components/ui";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, labelStyle, btnPrimary } from "@/lib/theme";
import { ESTADO_TAREA_MAP, PRIORIDADES, PRIORIDAD_MAP } from "@/lib/constants";
import { tareaBloqueada } from "@/lib/plan-template";
import type { Task, Prioridad, ProjectStage } from "@/lib/types";

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
  stages: ProjectStage[];
  users: MiniUser[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fProyecto, setFProyecto] = useState("");
  const [fResponsable, setFResponsable] = useState("");
  const [creating, setCreating] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.nombre])), [projects]);
  const stageMap = useMemo(() => new Map(stages.map((s) => [s.id, s.nombre])), [stages]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name || u.email])), [users]);
  const blockerIds = useMemo(() => new Set(tasks.map((t) => t.depends_on_task_id).filter(Boolean) as string[]), [tasks]);

  const hoy = new Date().toISOString().slice(0, 10);
  const filtered = useMemo(() => {
    const list = tasks.filter((t) => {
      // Solo accionable: no hecha, no marcada "bloqueada", y no bloqueada por una dependencia.
      if (t.estado === "hecha" || t.estado === "bloqueada") return false;
      if (tareaBloqueada(t, tasks, stages)) return false;
      if (fProyecto && t.project_id !== fProyecto) return false;
      if (fResponsable === "sin" && t.responsable_id) return false;
      if (fResponsable && fResponsable !== "sin" && t.responsable_id !== fResponsable) return false;
      return true;
    });
    return list.sort((a, b) => {
      const pa = PRIORIDAD_MAP[a.prioridad].orden;
      const pb = PRIORIDAD_MAP[b.prioridad].orden;
      if (pa !== pb) return pa - pb;
      return (a.fecha_limite ?? "9999-12-31").localeCompare(b.fecha_limite ?? "9999-12-31");
    });
  }, [tasks, stages, fProyecto, fResponsable]);

  async function marcarHecha(t: Task) {
    setBusy(true);
    await supabase.from("tasks").update({ estado: "hecha", completed_at: new Date().toISOString() }).eq("id", t.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ opacity: busy ? 0.7 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
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
        </div>
        <button onClick={() => setCreating(true)} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} /> Nueva tarea
        </button>
      </div>

      <p style={{ fontSize: 12.5, color: theme.textFaint, margin: "0 0 14px" }}>
        Se muestran todas las tareas <strong>accionables</strong> (ordenadas por prioridad). Se ocultan las hechas y las
        bloqueadas — por una dependencia o marcadas como bloqueadas.
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="Nada por ahora" description="No hay tareas con esos criterios." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((t) => {
            const est = ESTADO_TAREA_MAP[t.estado];
            const prio = PRIORIDAD_MAP[t.prioridad];
            const vencida = t.fecha_limite && t.fecha_limite < hoy;
            const esBloqueante = blockerIds.has(t.id);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface, flexWrap: "wrap" }}>
                <button onClick={() => marcarHecha(t)} title="Marcar hecha" style={{ width: 26, height: 26, borderRadius: "50%", border: `1.5px solid ${theme.border}`, background: "transparent", color: theme.textFaint, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Check size={14} />
                </button>
                <span title={`Prioridad ${prio.label}`} style={{ width: 8, height: 8, borderRadius: "50%", background: prio.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {t.titulo}
                    {esBloqueante && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: theme.accent, border: "1px solid rgba(245,158,11,0.4)", borderRadius: 6, padding: "1px 6px" }}>
                        <Lock size={11} /> bloqueante
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textFaint }}>
                    {t.project_id ? (
                      <Link href={`/app/proyectos/${t.project_id}/plan`} style={{ color: theme.textMuted, textDecoration: "none" }}>
                        {projectMap.get(t.project_id) ?? "Proyecto"}
                      </Link>
                    ) : (
                      "Sin proyecto"
                    )}
                    {t.stage_id && stageMap.get(t.stage_id) && ` · ${stageMap.get(t.stage_id)}`}
                  </div>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: prio.color }}>{prio.label}</span>
                {t.responsable_id && <span style={{ fontSize: 12.5, color: theme.textMuted }}>{userMap.get(t.responsable_id) ?? ""}</span>}
                <span style={{ fontSize: 12.5, color: vencida ? theme.danger : theme.textMuted, fontWeight: vencida ? 700 : 400 }}>{fmt(t.fecha_limite)}</span>
                <span style={{ fontSize: 11.5, color: est.color, fontWeight: 600 }}>{est.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <NuevaTareaModal
          projects={projects}
          users={users}
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function NuevaTareaModal({
  projects,
  users,
  onClose,
  onDone,
}: {
  projects: Mini[];
  users: MiniUser[];
  onClose: () => void;
  onDone: () => void;
}) {
  const supabase = createClient();
  const [titulo, setTitulo] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("normal");
  const [proyectoId, setProyectoId] = useState("");
  const [responsableId, setResponsableId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return setError("Ponle un título.");
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("tasks").insert({
      project_id: proyectoId || null,
      stage_id: null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      prioridad,
      responsable_id: responsableId || null,
      fecha_limite: fechaLimite || null,
      estado: "pendiente",
    });
    setSaving(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <Modal open onClose={onClose} title="Nueva tarea" width={560}>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Título *</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={inputStyle} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Prioridad</label>
          <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)} style={{ ...inputStyle, appearance: "auto" }}>
            {PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value} style={{ background: theme.surfaceSolid }}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Proyecto (opcional)</label>
          <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
            <option value="" style={{ background: theme.surfaceSolid }}>— Sin proyecto —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ background: theme.surfaceSolid }}>{p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Responsable</label>
          <select value={responsableId} onChange={(e) => setResponsableId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
            <option value="" style={{ background: theme.surfaceSolid }}>— Sin asignar —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id} style={{ background: theme.surfaceSolid }}>{u.full_name || u.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Fecha límite</label>
          <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        {error && <div style={{ gridColumn: "1 / -1", color: "#fca5a5", fontSize: 13 }}>{error}</div>}
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button type="submit" disabled={saving} className="es-btn" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "Guardando…" : "Crear tarea"}</button>
        </div>
      </form>
    </Modal>
  );
}
