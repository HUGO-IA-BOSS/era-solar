"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ListChecks,
  GanttChartSquare,
  List,
  Lock,
  RotateCcw,
  Camera,
  FileText,
  CheckSquare,
  Upload,
  Eye,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { theme, btnPrimary, btnGhost } from "@/lib/theme";
import { ESTADO_TAREA, ESTADO_TAREA_MAP, STORAGE_ATTACHMENTS } from "@/lib/constants";
import { proximaAccion, tareaBloqueada } from "@/lib/plan-template";
import type { ProjectStage, Task, TaskChecklistItem, EstadoTarea, TipoChecklist } from "@/lib/types";
import { generarPlan, regenerarPlan } from "../actions";
import { EmptyState } from "../../../../_components/ui";
import TaskEditor from "./TaskEditor";
import GanttView from "./GanttView";
import GenerarPlanModal from "./GenerarPlanModal";

type MiniUser = { id: string; full_name: string | null; email: string };
type Editor = { mode: "new"; stageId: string | null } | { mode: "edit"; task: Task } | null;

const fmtDate = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short" }) : null;

const tipoIcon = (t: TipoChecklist) => (t === "foto" ? Camera : t === "documento" ? FileText : CheckSquare);

export default function PlanWorkspace({
  projectId,
  stages,
  tasks,
  checklist,
  users,
}: {
  projectId: string;
  stages: ProjectStage[];
  tasks: Task[];
  checklist: TaskChecklistItem[];
  users: MiniUser[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"lista" | "gantt">("lista");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [openChecklist, setOpenChecklist] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<Editor>(null);
  const [planModal, setPlanModal] = useState<"generar" | "regenerar" | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name || u.email])), [users]);
  const bloqueoLabel = (t: Task) => {
    const b = tareaBloqueada(t, tasks, stages);
    return b ? (b.tipo === "etapa" ? `etapa: ${b.label}` : b.label) : null;
  };
  const tasksByStage = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) {
      const k = t.stage_id ?? "__none__";
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(t);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.orden - b.orden);
    return m;
  }, [tasks]);
  const checklistByTask = useMemo(() => {
    const m = new Map<string, TaskChecklistItem[]>();
    for (const c of checklist) {
      if (!m.has(c.task_id)) m.set(c.task_id, []);
      m.get(c.task_id)!.push(c);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.orden - b.orden);
    return m;
  }, [checklist]);

  const proxima = useMemo(() => proximaAccion(tasks, stages), [tasks, stages]);

  async function run(fn: () => PromiseLike<unknown>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
    setBusy(false);
    router.refresh();
  }

  const setTaskEstado = (t: Task, estado: EstadoTarea) =>
    run(() =>
      supabase
        .from("tasks")
        .update({ estado, completed_at: estado === "hecha" ? new Date().toISOString() : null })
        .eq("id", t.id)
    );
  const deleteTask = (t: Task) => confirm(`¿Eliminar la tarea "${t.titulo}"?`) && run(() => supabase.from("tasks").delete().eq("id", t.id));
  const toggleItem = (it: TaskChecklistItem) => run(() => supabase.from("task_checklist_items").update({ done: !it.done }).eq("id", it.id));
  const deleteItem = (it: TaskChecklistItem) => run(() => supabase.from("task_checklist_items").delete().eq("id", it.id));

  async function addItem(taskId: string) {
    const label = prompt("Nuevo ítem del checklist:");
    if (!label) return;
    const n = checklistByTask.get(taskId)?.length ?? 0;
    run(() => supabase.from("task_checklist_items").insert({ task_id: taskId, label, tipo: "check", orden: n }));
  }
  async function uploadItem(it: TaskChecklistItem, file: File) {
    const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `plan/${crypto.randomUUID()}-${safe}`;
    await run(async () => {
      const { error } = await supabase.storage.from(STORAGE_ATTACHMENTS).upload(path, file);
      if (error) throw error;
      await supabase.from("task_checklist_items").update({ storage_path: path, nombre_archivo: file.name, done: true }).eq("id", it.id);
    });
  }
  async function viewItem(it: TaskChecklistItem) {
    if (!it.storage_path) return;
    const { data } = await supabase.storage.from(STORAGE_ATTACHMENTS).createSignedUrl(it.storage_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function addStage() {
    const nombre = prompt("Nombre de la etapa:");
    if (!nombre) return;
    run(() => supabase.from("project_stages").insert({ project_id: projectId, nombre, orden: stages.length }));
  }
  async function renameStage(s: ProjectStage) {
    const nombre = prompt("Nombre de la etapa:", s.nombre);
    if (!nombre) return;
    run(() => supabase.from("project_stages").update({ nombre }).eq("id", s.id));
  }
  const deleteStage = (s: ProjectStage) =>
    confirm(`¿Eliminar la etapa "${s.nombre}"? Sus tareas quedarán sin etapa.`) &&
    run(() => supabase.from("project_stages").delete().eq("id", s.id));

  const orphan = tasksByStage.get("__none__") ?? [];
  const working = busy || pending;

  const confirmPlan = (fechas: string[]) => {
    setPlanError(null);
    start(async () => {
      const res = planModal === "regenerar" ? await regenerarPlan(projectId, fechas) : await generarPlan(projectId, fechas);
      if (res?.error) {
        setPlanError(res.error);
        return;
      }
      setPlanModal(null);
      router.refresh();
    });
  };
  const planModalEl = planModal ? (
    <GenerarPlanModal
      mode={planModal}
      working={working}
      error={planError}
      onClose={() => {
        setPlanModal(null);
        setPlanError(null);
      }}
      onConfirm={confirmPlan}
    />
  ) : null;

  // ---- Estado vacío ----
  if (stages.length === 0 && tasks.length === 0) {
    return (
      <>
        <EmptyState
          title="Este proyecto aún no tiene plan"
          description="Genera el plan estándar (visita, diseño, SEC, compras, instalación, cierre) y luego edítalo, o crea etapas a mano."
          action={
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setPlanModal("generar")} disabled={working} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} /> Generar plan estándar
              </button>
              <button onClick={addStage} disabled={working} style={btnGhost}>Agregar etapa manual</button>
            </div>
          }
        />
        {planModalEl}
      </>
    );
  }

  return (
    <div style={{ opacity: working ? 0.7 : 1 }}>
      {/* Próxima acción + toggle vista */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
        {proxima ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: theme.accentSoft, border: `1px solid rgba(245,158,11,0.35)`, borderRadius: 12, padding: "10px 16px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.accent, textTransform: "uppercase", letterSpacing: 0.5 }}>Próxima acción</span>
            <span style={{ fontWeight: 600 }}>{proxima.titulo}</span>
            {proxima.fecha_limite && <span style={{ fontSize: 12.5, color: theme.textMuted }}>· vence {fmtDate(proxima.fecha_limite)}</span>}
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: theme.ok }}>✓ Sin tareas pendientes</div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPlanModal("regenerar")} style={viewBtn(false)} title="Borrar y recrear desde la plantilla">
            <RotateCcw size={15} /> Regenerar
          </button>
          <button onClick={() => setView("lista")} style={viewBtn(view === "lista")}><List size={15} /> Lista</button>
          <button onClick={() => setView("gantt")} style={viewBtn(view === "gantt")}><GanttChartSquare size={15} /> Gantt</button>
        </div>
      </div>

      {view === "gantt" ? (
        <GanttView stages={stages} tasks={tasks} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stages.map((s) => {
            const stageTasks = tasksByStage.get(s.id) ?? [];
            const req = stageTasks.filter((t) => !t.opcional);
            const done = req.filter((t) => t.estado === "hecha").length;
            const isCollapsed = collapsed.has(s.id);
            return (
              <div key={s.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 14, background: theme.surface, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: isCollapsed ? "none" : `1px solid ${theme.border}` }}>
                  <button onClick={() => setCollapsed((p) => toggle(p, s.id))} style={iconBtnPlain}>
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: theme.textFaint }}>{done}/{req.length} tareas</div>
                  </div>
                  <div style={{ width: 80, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ width: `${req.length ? (done / req.length) * 100 : 0}%`, height: "100%", background: theme.ok }} />
                  </div>
                  <button onClick={() => setEditor({ mode: "new", stageId: s.id })} title="Agregar tarea" style={iconBtn}><Plus size={15} /></button>
                  <button onClick={() => renameStage(s)} title="Renombrar etapa" style={iconBtn}><Pencil size={14} /></button>
                  <button onClick={() => deleteStage(s)} title="Eliminar etapa" style={{ ...iconBtn, color: "#fca5a5" }}><Trash2 size={14} /></button>
                </div>
                {!isCollapsed && (
                  <div style={{ padding: "8px 14px 14px" }}>
                    {stageTasks.length === 0 ? (
                      <div style={{ fontSize: 13, color: theme.textFaint, padding: "6px 2px" }}>Sin tareas. Usa + para agregar.</div>
                    ) : (
                      stageTasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          items={checklistByTask.get(t.id) ?? []}
                          open={openChecklist.has(t.id)}
                          onToggleOpen={() => setOpenChecklist((p) => toggle(p, t.id))}
                          responsable={t.responsable_id ? userMap.get(t.responsable_id) ?? null : null}
                          dependsTitulo={bloqueoLabel(t)}
                          onEstado={(e) => setTaskEstado(t, e)}
                          onEdit={() => setEditor({ mode: "edit", task: t })}
                          onDelete={() => deleteTask(t)}
                          onToggleItem={toggleItem}
                          onDeleteItem={deleteItem}
                          onAddItem={() => addItem(t.id)}
                          onUploadItem={uploadItem}
                          onViewItem={viewItem}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {orphan.length > 0 && (
            <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 14, padding: "10px 14px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: theme.textMuted }}>Sin etapa</div>
              {orphan.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  items={checklistByTask.get(t.id) ?? []}
                  open={openChecklist.has(t.id)}
                  onToggleOpen={() => setOpenChecklist((p) => toggle(p, t.id))}
                  responsable={t.responsable_id ? userMap.get(t.responsable_id) ?? null : null}
                  dependsTitulo={bloqueoLabel(t)}
                  onEstado={(e) => setTaskEstado(t, e)}
                  onEdit={() => setEditor({ mode: "edit", task: t })}
                  onDelete={() => deleteTask(t)}
                  onToggleItem={toggleItem}
                  onDeleteItem={deleteItem}
                  onAddItem={() => addItem(t.id)}
                  onUploadItem={uploadItem}
                  onViewItem={viewItem}
                />
              ))}
            </div>
          )}

          <button onClick={addStage} disabled={working} className="es-card-link" style={{ border: `1px dashed ${theme.borderStrong}`, borderRadius: 12, background: "transparent", color: theme.textMuted, padding: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <Plus size={18} color={theme.accent} /> Agregar etapa
          </button>
        </div>
      )}

      {editor && (
        <TaskEditor
          projectId={projectId}
          stages={stages}
          users={users}
          tasks={tasks}
          initial={editor.mode === "edit" ? editor.task : undefined}
          defaultStageId={editor.mode === "new" ? editor.stageId : undefined}
          onDone={() => {
            setEditor(null);
            router.refresh();
          }}
          onCancel={() => setEditor(null)}
        />
      )}

      {planModalEl}
    </div>
  );
}

function TaskRow({
  task,
  items,
  open,
  onToggleOpen,
  responsable,
  dependsTitulo,
  onEstado,
  onEdit,
  onDelete,
  onToggleItem,
  onDeleteItem,
  onAddItem,
  onUploadItem,
  onViewItem,
}: {
  task: Task;
  items: TaskChecklistItem[];
  open: boolean;
  onToggleOpen: () => void;
  responsable: string | null;
  dependsTitulo: string | null;
  onEstado: (e: EstadoTarea) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleItem: (it: TaskChecklistItem) => void;
  onDeleteItem: (it: TaskChecklistItem) => void;
  onAddItem: () => void;
  onUploadItem: (it: TaskChecklistItem, f: File) => void;
  onViewItem: (it: TaskChecklistItem) => void;
}) {
  const est = ESTADO_TAREA_MAP[task.estado];
  const itemsDone = items.filter((i) => i.done).length;
  return (
    <div style={{ borderTop: `1px solid ${theme.border}`, padding: "10px 2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: est.color, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ textDecoration: task.estado === "hecha" ? "line-through" : "none", opacity: task.estado === "hecha" ? 0.6 : 1 }}>{task.titulo}</span>
            {task.opcional && <span style={tag}>opcional</span>}
            {dependsTitulo && (
              <span style={{ ...tag, color: "#fca5a5", borderColor: "rgba(239,68,68,0.4)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Lock size={11} /> espera: {dependsTitulo}
              </span>
            )}
          </div>
          {task.descripcion && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 2 }}>{task.descripcion}</div>}
        </div>
        {responsable && <span style={{ fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>{responsable}</span>}
        {task.fecha_limite && <span style={{ fontSize: 12, color: theme.textMuted, whiteSpace: "nowrap" }}>{fmtDate(task.fecha_limite)}</span>}
        {items.length > 0 && (
          <button onClick={onToggleOpen} title="Checklist" style={{ ...iconBtnPlain, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: itemsDone === items.length ? theme.ok : theme.textMuted, width: "auto", padding: "0 6px" }}>
            <ListChecks size={15} /> {itemsDone}/{items.length}
          </button>
        )}
        <select value={task.estado} onChange={(e) => onEstado(e.target.value as EstadoTarea)} style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${theme.border}`, borderRadius: 8, color: est.color, fontSize: 12.5, fontWeight: 600, padding: "5px 8px", cursor: "pointer" }}>
          {ESTADO_TAREA.map((s) => (
            <option key={s.value} value={s.value} style={{ background: theme.surfaceSolid, color: theme.text }}>{s.label}</option>
          ))}
        </select>
        <button onClick={onEdit} title="Editar" style={iconBtn}><Pencil size={14} /></button>
        <button onClick={onDelete} title="Eliminar" style={{ ...iconBtn, color: "#fca5a5" }}><Trash2 size={14} /></button>
      </div>

      {open && items.length > 0 && (
        <div style={{ marginTop: 8, marginLeft: 19, display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map((it) => {
            const Icon = tipoIcon(it.tipo);
            return (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={it.done} onChange={() => onToggleItem(it)} />
                <Icon size={14} color={theme.textFaint} />
                <span style={{ flex: 1, minWidth: 0, opacity: it.done ? 0.6 : 1 }}>
                  {it.label} {it.opcional && <span style={{ ...tag, fontSize: 10 }}>opcional</span>}
                </span>
                {(it.tipo === "foto" || it.tipo === "documento") && (
                  <>
                    {it.storage_path && (
                      <button onClick={() => onViewItem(it)} title="Ver" style={iconMini}><Eye size={13} /></button>
                    )}
                    <label title="Subir" style={{ ...iconMini, cursor: "pointer" }}>
                      <Upload size={13} />
                      <input type="file" accept={it.tipo === "foto" ? "image/*" : "application/pdf,image/*"} style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && onUploadItem(it, e.target.files[0])} />
                    </label>
                  </>
                )}
                <button onClick={() => onDeleteItem(it)} title="Quitar ítem" style={{ ...iconMini, color: "#fca5a5" }}><Trash2 size={13} /></button>
              </div>
            );
          })}
          <button onClick={onAddItem} style={{ alignSelf: "flex-start", background: "transparent", border: "none", color: theme.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "2px 0" }}>+ Agregar ítem</button>
        </div>
      )}
      {open && items.length === 0 && (
        <div style={{ marginTop: 6, marginLeft: 19 }}>
          <button onClick={onAddItem} style={{ background: "transparent", border: "none", color: theme.accent, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>+ Agregar ítem de checklist</button>
        </div>
      )}
    </div>
  );
}

function toggle(set: Set<string>, id: string) {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

const viewBtn = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 12px",
  borderRadius: 9,
  border: `1px solid ${active ? "rgba(245,158,11,0.5)" : theme.border}`,
  background: active ? theme.accentSoft : "transparent",
  color: active ? theme.accent : theme.textMuted,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});
const iconBtn: React.CSSProperties = { background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, width: 30, height: 30, display: "grid", placeItems: "center", color: theme.textMuted, cursor: "pointer", flexShrink: 0 };
const iconBtnPlain: React.CSSProperties = { background: "transparent", border: "none", color: theme.textMuted, cursor: "pointer", width: 26, height: 26, display: "grid", placeItems: "center" };
const iconMini: React.CSSProperties = { background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 6, width: 26, height: 26, display: "grid", placeItems: "center", color: theme.textMuted, cursor: "pointer", flexShrink: 0 };
const tag: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: theme.textFaint, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "1px 6px" };
