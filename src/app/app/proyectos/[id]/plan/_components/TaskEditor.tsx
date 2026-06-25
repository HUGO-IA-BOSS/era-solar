"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import Modal from "../../../../_components/Modal";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, labelStyle, btnPrimary } from "@/lib/theme";
import { ESTADO_TAREA, PRIORIDADES } from "@/lib/constants";
import type { ProjectStage, Task, EstadoTarea, TipoChecklist, Prioridad } from "@/lib/types";

type MiniUser = { id: string; full_name: string | null; email: string };
type DraftItem = { label: string; tipo: TipoChecklist; opcional: boolean };
const fullRow: React.CSSProperties = { gridColumn: "1 / -1" };

export default function TaskEditor({
  projectId,
  stages,
  users,
  tasks,
  initial,
  defaultStageId,
  onDone,
  onCancel,
}: {
  projectId: string;
  stages: ProjectStage[];
  users: MiniUser[];
  tasks: Task[];
  initial?: Task;
  defaultStageId?: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();
  const isNew = !initial;

  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [stageId, setStageId] = useState(initial?.stage_id ?? defaultStageId ?? "");
  const [responsableId, setResponsableId] = useState(initial?.responsable_id ?? "");
  const [estado, setEstado] = useState<EstadoTarea>(initial?.estado ?? "pendiente");
  const [prioridad, setPrioridad] = useState<Prioridad>(initial?.prioridad ?? "normal");
  const [opcional, setOpcional] = useState(initial?.opcional ?? false);
  const [fechaInicio, setFechaInicio] = useState(initial?.fecha_inicio ?? "");
  const [fechaLimite, setFechaLimite] = useState(initial?.fecha_limite ?? "");
  const [dependsOn, setDependsOn] = useState(initial?.depends_on_task_id ?? "");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return setError("Ponle un título a la tarea.");
    setSaving(true);
    setError(null);
    try {
      const payload = {
        project_id: projectId,
        stage_id: stageId || null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        responsable_id: responsableId || null,
        estado,
        prioridad,
        opcional,
        fecha_inicio: fechaInicio || null,
        fecha_limite: fechaLimite || null,
        depends_on_task_id: dependsOn || null,
        completed_at: estado === "hecha" ? new Date().toISOString() : null,
      };
      if (initial) {
        const { error: e2 } = await supabase.from("tasks").update(payload).eq("id", initial.id);
        if (e2) throw e2;
      } else {
        const orden = tasks.filter((t) => (t.stage_id ?? "") === (stageId || "")).length;
        const { data, error: e2 } = await supabase.from("tasks").insert({ ...payload, orden }).select("id").single();
        if (e2) throw e2;
        const valid = items.filter((i) => i.label.trim());
        if (valid.length) {
          await supabase.from("task_checklist_items").insert(
            valid.map((i, idx) => ({ task_id: data.id, label: i.label.trim(), tipo: i.tipo, opcional: i.opcional, orden: idx }))
          );
        }
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la tarea");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onCancel} title={isNew ? "Nueva tarea" : "Editar tarea"} width={620}>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={fullRow}>
          <label style={labelStyle}>Título *</label>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={inputStyle} autoFocus />
        </div>

        <div>
          <label style={labelStyle}>Etapa</label>
          <select value={stageId} onChange={(e) => setStageId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
            <option value="" style={{ background: theme.surfaceSolid }}>— Sin etapa —</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id} style={{ background: theme.surfaceSolid }}>{s.nombre}</option>
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
          <label style={labelStyle}>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoTarea)} style={{ ...inputStyle, appearance: "auto" }}>
            {ESTADO_TAREA.map((s) => (
              <option key={s.value} value={s.value} style={{ background: theme.surfaceSolid }}>{s.label}</option>
            ))}
          </select>
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
          <label style={labelStyle}>Depende de</label>
          <select value={dependsOn} onChange={(e) => setDependsOn(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
            <option value="" style={{ background: theme.surfaceSolid }}>— Ninguna —</option>
            {tasks.filter((t) => t.id !== initial?.id).map((t) => (
              <option key={t.id} value={t.id} style={{ background: theme.surfaceSolid }}>{t.titulo}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Fecha inicio</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Fecha límite</label>
          <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} style={inputStyle} />
        </div>

        <div style={fullRow}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: theme.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={opcional} onChange={(e) => setOpcional(e.target.checked)} /> Tarea opcional (no bloquea el avance)
          </label>
        </div>

        <div style={fullRow}>
          <label style={labelStyle}>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {isNew && (
          <div style={{ ...fullRow, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textMuted, marginBottom: 8 }}>Checklist (opcional)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input value={it.label} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Ítem…" style={{ ...inputStyle, flex: 1 }} />
                  <select value={it.tipo} onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, tipo: e.target.value as TipoChecklist } : x)))} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
                    <option value="check" style={{ background: theme.surfaceSolid }}>Marcar</option>
                    <option value="foto" style={{ background: theme.surfaceSolid }}>Foto</option>
                    <option value="documento" style={{ background: theme.surfaceSolid }}>Documento</option>
                  </select>
                  <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} style={{ background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, width: 34, height: 34, color: "#fca5a5", cursor: "pointer" }}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setItems((p) => [...p, { label: "", tipo: "check", opcional: false }])} style={{ marginTop: 8, background: "transparent", border: "none", color: theme.accent, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Agregar ítem
            </button>
          </div>
        )}

        {error && <div style={{ ...fullRow, color: "#fca5a5", fontSize: 13 }}>{error}</div>}

        <div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
          <button type="submit" disabled={saving} className="es-btn" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>{saving ? "Guardando…" : isNew ? "Crear tarea" : "Guardar"}</button>
        </div>
      </form>
    </Modal>
  );
}
