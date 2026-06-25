"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, ListChecks, Save, RotateCcw, AlertTriangle, Check } from "lucide-react";
import { theme, inputStyle, btnPrimary, btnGhost } from "@/lib/theme";
import { validateTemplate, defaultStoredTemplate, type StoredStage, type StoredTask } from "@/lib/plan-template";
import type { TipoChecklist } from "@/lib/types";
import { savePlantilla } from "../actions";

const newKey = () => crypto.randomUUID();

export default function PlantillaEditor({ initial }: { initial: StoredStage[] }) {
  const router = useRouter();
  const [stages, setStages] = useState<StoredStage[]>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openChk, setOpenChk] = useState<Set<string>>(new Set());

  const update = (next: StoredStage[]) => {
    setStages(next);
    setSaved(false);
  };

  // ---- mutaciones ----
  const setStageField = (sk: string, patch: Partial<StoredStage>) =>
    update(stages.map((s) => (s.key === sk ? { ...s, ...patch } : s)));
  const addStage = () => update([...stages, { key: newKey(), nombre: "Nueva etapa", dependsOnStageKey: null, tasks: [] }]);
  const delStage = (sk: string) => {
    const removedTasks = new Set(stages.find((s) => s.key === sk)?.tasks.map((t) => t.key) ?? []);
    update(
      stages
        .filter((s) => s.key !== sk)
        .map((s) => ({
          ...s,
          dependsOnStageKey: s.dependsOnStageKey === sk ? null : s.dependsOnStageKey,
          tasks: s.tasks.map((t) => (removedTasks.has(t.dependsOnTaskKey ?? "") ? { ...t, dependsOnTaskKey: null } : t)),
        }))
    );
  };
  const moveStage = (i: number, dir: number) => {
    const j = i + dir;
    if (j < 0 || j >= stages.length) return;
    const arr = [...stages];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update(arr);
  };

  const mutTask = (sk: string, tk: string, fn: (t: StoredTask) => StoredTask) =>
    update(stages.map((s) => (s.key !== sk ? s : { ...s, tasks: s.tasks.map((t) => (t.key === tk ? fn(t) : t)) })));
  const setTask = (sk: string, tk: string, patch: Partial<StoredTask>) => mutTask(sk, tk, (t) => ({ ...t, ...patch }));
  const addTask = (sk: string) =>
    update(stages.map((s) => (s.key !== sk ? s : { ...s, tasks: [...s.tasks, { key: newKey(), titulo: "Nueva tarea", checklist: [] }] })));
  const delTask = (sk: string, tk: string) =>
    update(
      stages.map((s) => ({
        ...s,
        tasks: (s.key === sk ? s.tasks.filter((t) => t.key !== tk) : s.tasks).map((t) =>
          t.dependsOnTaskKey === tk ? { ...t, dependsOnTaskKey: null } : t
        ),
      }))
    );
  const moveTask = (sk: string, i: number, dir: number) =>
    update(
      stages.map((s) => {
        if (s.key !== sk) return s;
        const j = i + dir;
        if (j < 0 || j >= s.tasks.length) return s;
        const arr = [...s.tasks];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return { ...s, tasks: arr };
      })
    );

  const addChk = (sk: string, tk: string) => mutTask(sk, tk, (t) => ({ ...t, checklist: [...t.checklist, { label: "Nuevo ítem", tipo: "check" }] }));
  const setChk = (sk: string, tk: string, idx: number, patch: Partial<{ label: string; tipo: TipoChecklist; opcional: boolean }>) =>
    mutTask(sk, tk, (t) => ({ ...t, checklist: t.checklist.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }));
  const delChk = (sk: string, tk: string, idx: number) => mutTask(sk, tk, (t) => ({ ...t, checklist: t.checklist.filter((_, i) => i !== idx) }));

  const allTaskOptions = stages.flatMap((s) => s.tasks.map((t) => ({ key: t.key, label: `${s.nombre} › ${t.titulo}` })));

  async function save() {
    const errs = validateTemplate(stages);
    setErrors(errs);
    if (errs.length) return;
    setSaving(true);
    const res = await savePlantilla(stages);
    setSaving(false);
    if (res.error) setErrors([res.error]);
    else {
      setSaved(true);
      router.refresh();
    }
  }
  function restore() {
    if (confirm("¿Restaurar la plantilla por defecto? Perderás los cambios no guardados.")) {
      setErrors([]);
      update(defaultStoredTemplate());
    }
  }

  return (
    <div>
      {/* Barra de acciones */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button onClick={save} disabled={saving} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Save size={16} /> {saving ? "Guardando…" : "Guardar plantilla"}
        </button>
        <button onClick={restore} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <RotateCcw size={15} /> Restaurar por defecto
        </button>
        {saved && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.ok, fontSize: 13 }}>
            <Check size={15} /> Guardado
          </span>
        )}
        <span style={{ fontSize: 12, color: theme.textFaint, marginLeft: "auto" }}>
          Cambios afectan a planes <strong>nuevos o regenerados</strong>.
        </span>
      </div>

      {errors.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fca5a5", fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>
            <AlertTriangle size={16} /> No se puede guardar — corrige esto:
          </div>
          <ul style={{ margin: 0, paddingLeft: 22, color: "#fca5a5", fontSize: 13, lineHeight: 1.6 }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Etapas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {stages.map((s, si) => (
          <div key={s.key} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.surface, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: theme.bgElev, borderBottom: `1px solid ${theme.border}`, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <button onClick={() => moveStage(si, -1)} disabled={si === 0} style={miniIcon}><ChevronUp size={14} /></button>
                <button onClick={() => moveStage(si, 1)} disabled={si === stages.length - 1} style={miniIcon}><ChevronDown size={14} /></button>
              </div>
              <input value={s.nombre} onChange={(e) => setStageField(s.key, { nombre: e.target.value })} placeholder="Nombre de la etapa" style={{ ...inputStyle, flex: 1, minWidth: 160, fontWeight: 700 }} />
              <span style={{ fontSize: 12.5, color: theme.textMuted }}>depende de:</span>
              <select value={s.dependsOnStageKey ?? ""} onChange={(e) => setStageField(s.key, { dependsOnStageKey: e.target.value || null })} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
                <option value="" style={{ background: theme.surfaceSolid }}>— ninguna —</option>
                {stages.filter((o) => o.key !== s.key).map((o) => (
                  <option key={o.key} value={o.key} style={{ background: theme.surfaceSolid }}>{o.nombre}</option>
                ))}
              </select>
              <button onClick={() => delStage(s.key)} title="Eliminar etapa" style={{ ...miniIcon, color: "#fca5a5", width: 30, height: 30 }}><Trash2 size={15} /></button>
            </div>

            <div style={{ padding: "8px 14px 14px" }}>
              {s.tasks.map((t, ti) => {
                const open = openChk.has(t.key);
                return (
                  <div key={t.key} style={{ borderTop: ti === 0 ? "none" : `1px solid ${theme.border}`, padding: "9px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <button onClick={() => moveTask(s.key, ti, -1)} disabled={ti === 0} style={miniIcon}><ChevronUp size={12} /></button>
                        <button onClick={() => moveTask(s.key, ti, 1)} disabled={ti === s.tasks.length - 1} style={miniIcon}><ChevronDown size={12} /></button>
                      </div>
                      <input value={t.titulo} onChange={(e) => setTask(s.key, t.key, { titulo: e.target.value })} placeholder="Título de la tarea" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
                      <span style={{ fontSize: 12, color: theme.textFaint }}>dep:</span>
                      <select value={t.dependsOnTaskKey ?? ""} onChange={(e) => setTask(s.key, t.key, { dependsOnTaskKey: e.target.value || null })} style={{ ...inputStyle, width: "auto", appearance: "auto", maxWidth: 200 }}>
                        <option value="" style={{ background: theme.surfaceSolid }}>— ninguna —</option>
                        {allTaskOptions.filter((o) => o.key !== t.key).map((o) => (
                          <option key={o.key} value={o.key} style={{ background: theme.surfaceSolid }}>{o.label}</option>
                        ))}
                      </select>
                      <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.textMuted, cursor: "pointer" }}>
                        <input type="checkbox" checked={!!t.opcional} onChange={(e) => setTask(s.key, t.key, { opcional: e.target.checked })} /> opc.
                      </label>
                      <button onClick={() => setOpenChk((p) => toggle(p, t.key))} style={{ ...miniIcon, width: "auto", padding: "0 8px", gap: 4, display: "inline-flex", alignItems: "center", color: theme.textMuted, fontSize: 12 }} title="Checklist">
                        <ListChecks size={14} /> {t.checklist.length}
                      </button>
                      <button onClick={() => delTask(s.key, t.key)} title="Eliminar tarea" style={{ ...miniIcon, color: "#fca5a5", width: 28, height: 28 }}><Trash2 size={13} /></button>
                    </div>

                    {open && (
                      <div style={{ marginTop: 8, marginLeft: 28, display: "flex", flexDirection: "column", gap: 6 }}>
                        {t.checklist.map((c, ci) => (
                          <div key={ci} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input value={c.label} onChange={(e) => setChk(s.key, t.key, ci, { label: e.target.value })} placeholder="Ítem del checklist" style={{ ...inputStyle, flex: 1 }} />
                            <select value={c.tipo} onChange={(e) => setChk(s.key, t.key, ci, { tipo: e.target.value as TipoChecklist })} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
                              <option value="check" style={{ background: theme.surfaceSolid }}>Marcar</option>
                              <option value="foto" style={{ background: theme.surfaceSolid }}>Foto</option>
                              <option value="documento" style={{ background: theme.surfaceSolid }}>Documento</option>
                            </select>
                            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: theme.textMuted, cursor: "pointer" }}>
                              <input type="checkbox" checked={!!c.opcional} onChange={(e) => setChk(s.key, t.key, ci, { opcional: e.target.checked })} /> opc.
                            </label>
                            <button onClick={() => delChk(s.key, t.key, ci)} style={{ ...miniIcon, color: "#fca5a5", width: 28, height: 28 }}><Trash2 size={13} /></button>
                          </div>
                        ))}
                        <button onClick={() => addChk(s.key, t.key)} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: theme.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                          + Agregar ítem
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <button onClick={() => addTask(s.key)} style={{ marginTop: 10, background: "transparent", border: `1px dashed ${theme.border}`, borderRadius: 8, color: theme.textMuted, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Plus size={14} color={theme.accent} /> Agregar tarea
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addStage} className="es-card-link" style={{ marginTop: 14, width: "100%", border: `1px dashed ${theme.borderStrong}`, borderRadius: 12, background: "transparent", color: theme.textMuted, padding: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
        <Plus size={18} color={theme.accent} /> Agregar etapa
      </button>
    </div>
  );
}

function toggle(set: Set<string>, id: string) {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

const miniIcon: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${theme.border}`,
  borderRadius: 6,
  width: 24,
  height: 22,
  display: "grid",
  placeItems: "center",
  color: theme.textMuted,
  cursor: "pointer",
  margin: "1px 0",
};
