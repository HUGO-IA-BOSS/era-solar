"use client";

import { useRef, useState } from "react";
import { theme } from "@/lib/theme";
import { ESTADO_TAREA_MAP } from "@/lib/constants";
import type { ProjectStage, Task } from "@/lib/types";

const PX = 28; // px por día
const ROW_H = 34;
const LABEL_W = 210;
const HEADER_H = 30;
const BAR_H = 20;

const toDay = (d: string) => Math.floor(Date.parse(d + "T00:00:00Z") / 86400000);
const fromDay = (day: number) => new Date(day * 86400000).toISOString().slice(0, 10);
const fmt = (day: number) => new Date(day * 86400000).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

type Row = { kind: "stage"; stage: ProjectStage } | { kind: "task"; task: Task };

export default function GanttView({
  stages,
  tasks,
  onCommit,
}: {
  stages: ProjectStage[];
  tasks: Task[];
  onCommit: (taskId: string, inicio: string, limite: string) => void;
}) {
  const dragRef = useRef<{ id: string; mode: "move" | "resize-l" | "resize-r"; startX: number; origS: number; origE: number } | null>(null);
  const [draft, setDraft] = useState<{ id: string; sDay: number; eDay: number } | null>(null);

  // Filas ordenadas: cabecera de etapa + sus tareas; al final, tareas sin etapa.
  const rows: Row[] = [];
  const stagesSorted = [...stages].sort((a, b) => a.orden - b.orden);
  const byStage = new Map<string, Task[]>();
  for (const t of tasks) {
    const k = t.stage_id ?? "__none__";
    if (!byStage.has(k)) byStage.set(k, []);
    byStage.get(k)!.push(t);
  }
  for (const arr of byStage.values()) arr.sort((a, b) => a.orden - b.orden);
  for (const s of stagesSorted) {
    rows.push({ kind: "stage", stage: s });
    for (const t of byStage.get(s.id) ?? []) rows.push({ kind: "task", task: t });
  }
  const orphan = byStage.get("__none__") ?? [];
  for (const t of orphan) rows.push({ kind: "task", task: t });

  const taskDays = (t: Task): [number, number] | null => {
    const s = t.fecha_inicio ?? t.fecha_limite;
    const e = t.fecha_limite ?? t.fecha_inicio;
    if (!s || !e) return null;
    return [toDay(s), Math.max(toDay(s), toDay(e))];
  };

  // Rango de fechas
  const allDays: number[] = [];
  for (const t of tasks) {
    const d = taskDays(t);
    if (d) allDays.push(d[0], d[1]);
  }
  for (const s of stages) {
    if (s.fecha_inicio) allDays.push(toDay(s.fecha_inicio));
    if (s.fecha_fin) allDays.push(toDay(s.fecha_fin));
  }
  if (allDays.length === 0) {
    return (
      <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>
        Aún no hay fechas. Genera el plan con fechas o ponle inicio/límite a las tareas.
      </div>
    );
  }
  const minDay = Math.min(...allDays) - 2;
  const maxDay = Math.max(...allDays) + 3;
  const days = maxDay - minDay + 1;
  const width = days * PX;
  const bodyH = rows.length * ROW_H;

  // posición (draft-aware) de una tarea
  const posOf = (t: Task): { x0: number; x1: number } | null => {
    let s: number, e: number;
    if (draft && draft.id === t.id) {
      s = draft.sDay;
      e = draft.eDay;
    } else {
      const d = taskDays(t);
      if (!d) return null;
      [s, e] = d;
    }
    return { x0: (s - minDay) * PX, x1: (e - minDay + 1) * PX };
  };
  const rowIndexOfTask = new Map<string, number>();
  rows.forEach((r, i) => {
    if (r.kind === "task") rowIndexOfTask.set(r.task.id, i);
  });

  function startDrag(e: React.PointerEvent, t: Task) {
    const d = taskDays(t);
    if (!d) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const off = e.clientX - rect.left;
    const mode = off < 9 ? "resize-l" : off > rect.width - 9 ? "resize-r" : "move";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: t.id, mode, startX: e.clientX, origS: d[0], origE: d[1] };
    setDraft({ id: t.id, sDay: d[0], eDay: d[1] });
  }
  function computeDrag(clientX: number) {
    const d = dragRef.current!;
    const delta = Math.round((clientX - d.startX) / PX);
    let sDay = d.origS;
    let eDay = d.origE;
    if (d.mode === "move") {
      sDay = d.origS + delta;
      eDay = d.origE + delta;
    } else if (d.mode === "resize-l") {
      sDay = Math.min(d.origS + delta, d.origE);
    } else {
      eDay = Math.max(d.origE + delta, d.origS);
    }
    return { sDay, eDay };
  }
  function onMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const { sDay, eDay } = computeDrag(e.clientX);
    setDraft({ id: dragRef.current.id, sDay, eDay });
  }
  function onUp(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const { sDay, eDay } = computeDrag(e.clientX);
    dragRef.current = null;
    setDraft(null);
    onCommit(d.id, fromDay(sDay), fromDay(eDay));
  }

  // ticks semanales
  const ticks: number[] = [];
  for (let d = minDay; d <= maxDay; d++) if ((d - minDay) % 7 === 0) ticks.push(d);
  const todayDay = toDay(new Date().toISOString().slice(0, 10));

  // arrows: dependencias entre tareas con posición
  const arrows: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const t of tasks) {
    if (!t.depends_on_task_id) continue;
    const from = tasks.find((x) => x.id === t.depends_on_task_id);
    if (!from) continue;
    const pf = posOf(from);
    const pt = posOf(t);
    const rf = rowIndexOfTask.get(from.id);
    const rt = rowIndexOfTask.get(t.id);
    if (!pf || !pt || rf == null || rt == null) continue;
    arrows.push({ x1: pf.x1, y1: rf * ROW_H + ROW_H / 2, x2: pt.x0, y2: rt * ROW_H + ROW_H / 2 });
  }

  // arrows de dependencia de ETAPA: última tarea de la etapa prerequisito -> primera de la dependiente
  const stageArrows: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (const s of stagesSorted) {
    if (!s.depends_on_stage_id) continue;
    const pre = (byStage.get(s.depends_on_stage_id) ?? [])
      .map((t) => ({ p: posOf(t), r: rowIndexOfTask.get(t.id) }))
      .filter((x) => x.p && x.r != null);
    const mine = (byStage.get(s.id) ?? [])
      .map((t) => ({ p: posOf(t), r: rowIndexOfTask.get(t.id) }))
      .filter((x) => x.p && x.r != null);
    if (!pre.length || !mine.length) continue;
    const from = pre.reduce((a, b) => (b.p!.x1 > a.p!.x1 ? b : a));
    const to = mine.reduce((a, b) => (b.p!.x0 < a.p!.x0 ? b : a));
    stageArrows.push({ x1: from.p!.x1, y1: from.r! * ROW_H + ROW_H / 2, x2: to.p!.x0, y2: to.r! * ROW_H + ROW_H / 2 });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: theme.textFaint, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 18, borderTop: `1.5px solid ${theme.textFaint}` }} /> dependencia de tarea
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 18, borderTop: `1.5px dashed ${theme.accent}` }} /> dependencia de etapa
        </span>
        <span>· arrastra una barra para mover, estira los bordes para alargar</span>
      </div>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflowX: "auto", background: theme.bgElev }}>
        <div style={{ display: "flex", minWidth: LABEL_W + width }}>
        {/* Columna de etiquetas (sticky) */}
        <div style={{ width: LABEL_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 3, background: theme.bgElev, borderRight: `1px solid ${theme.border}` }}>
          <div style={{ height: HEADER_H, borderBottom: `1px solid ${theme.border}` }} />
          {rows.map((r, i) =>
            r.kind === "stage" ? (
              <div key={"s" + r.stage.id} style={{ height: ROW_H, display: "flex", alignItems: "center", padding: "0 12px", fontSize: 12.5, fontWeight: 700, background: "rgba(0,0,0,0.04)", borderBottom: `1px solid ${theme.border}` }}>
                {r.stage.nombre}
              </div>
            ) : (
              <div key={"t" + r.task.id} style={{ height: ROW_H, display: "flex", alignItems: "center", padding: "0 12px 0 22px", fontSize: 12.5, color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderBottom: `1px solid ${theme.border}` }} title={r.task.titulo}>
                {r.task.titulo}
              </div>
            )
          )}
        </div>

        {/* Timeline */}
        <div style={{ position: "relative", width }}>
          {/* Eje de fechas */}
          <div style={{ height: HEADER_H, position: "relative", borderBottom: `1px solid ${theme.border}` }}>
            {ticks.map((d) => (
              <div key={d} style={{ position: "absolute", left: (d - minDay) * PX, top: 0, height: HEADER_H, display: "flex", alignItems: "center", paddingLeft: 4, fontSize: 11, color: theme.textFaint, whiteSpace: "nowrap" }}>
                {fmt(d)}
              </div>
            ))}
          </div>

          {/* Cuerpo */}
          <div style={{ position: "relative", height: bodyH }}>
            {/* gridlines semanales */}
            {ticks.map((d) => (
              <div key={d} style={{ position: "absolute", left: (d - minDay) * PX, top: 0, height: bodyH, width: 1, background: "rgba(0,0,0,0.08)" }} />
            ))}
            {/* hoy */}
            {todayDay >= minDay && todayDay <= maxDay && (
              <div style={{ position: "absolute", left: (todayDay - minDay) * PX, top: 0, height: bodyH, width: 2, background: "rgba(245,158,11,0.5)" }} title="Hoy" />
            )}
            {/* bandas de etapa */}
            {rows.map((r, i) =>
              r.kind === "stage" ? (
                <div key={"sb" + r.stage.id} style={{ position: "absolute", top: i * ROW_H, left: 0, width, height: ROW_H, background: "rgba(0,0,0,0.04)", borderBottom: `1px solid ${theme.border}` }} />
              ) : null
            )}

            {/* flechas de dependencia */}
            <svg width={width} height={bodyH} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              <defs>
                <marker id="gantt-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 Z" fill={theme.textFaint} />
                </marker>
                <marker id="gantt-arrow-stage" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L7,3.5 L0,7 Z" fill={theme.accent} />
                </marker>
              </defs>
              {arrows.map((a, i) => {
                const midX = Math.max(a.x1 + 10, a.x2 - 10);
                return (
                  <path
                    key={i}
                    d={`M ${a.x1} ${a.y1} H ${midX} V ${a.y2} H ${a.x2}`}
                    fill="none"
                    stroke={theme.textFaint}
                    strokeWidth={1.4}
                    markerEnd="url(#gantt-arrow)"
                  />
                );
              })}
              {stageArrows.map((a, i) => {
                const midX = Math.max(a.x1 + 10, a.x2 - 10);
                return (
                  <path
                    key={"st" + i}
                    d={`M ${a.x1} ${a.y1} H ${midX} V ${a.y2} H ${a.x2}`}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    opacity={0.85}
                    markerEnd="url(#gantt-arrow-stage)"
                  />
                );
              })}
            </svg>

            {/* barras de tareas */}
            {rows.map((r, i) => {
              if (r.kind !== "task") return null;
              const t = r.task;
              const p = posOf(t);
              if (!p) {
                return (
                  <div key={t.id} style={{ position: "absolute", top: i * ROW_H + (ROW_H - BAR_H) / 2, left: 4, height: BAR_H, display: "flex", alignItems: "center", fontSize: 11, color: theme.textFaint }}>
                    sin fecha
                  </div>
                );
              }
              const color = ESTADO_TAREA_MAP[t.estado].color;
              const w = Math.max(10, p.x1 - p.x0);
              return (
                <div
                  key={t.id}
                  onPointerDown={(e) => startDrag(e, t)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  title={`${t.titulo} — arrastra para mover, bordes para alargar`}
                  style={{
                    position: "absolute",
                    top: i * ROW_H + (ROW_H - BAR_H) / 2,
                    left: p.x0,
                    width: w,
                    height: BAR_H,
                    background: `${color}d0`,
                    border: `1px solid ${color}`,
                    borderRadius: 5,
                    cursor: "grab",
                    touchAction: "none",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 7,
                    fontSize: 11,
                    color: "#0a0b0d",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    boxShadow: draft?.id === t.id ? "0 2px 10px rgba(0,0,0,0.4)" : "none",
                  }}
                >
                  {/* asas de resize */}
                  <span style={{ position: "absolute", left: 0, top: 0, height: "100%", width: 8, cursor: "ew-resize" }} />
                  <span style={{ position: "absolute", right: 0, top: 0, height: "100%", width: 8, cursor: "ew-resize" }} />
                  {w > 46 ? t.titulo : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
