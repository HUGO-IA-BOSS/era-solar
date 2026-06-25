"use client";

import { useMemo } from "react";
import { theme } from "@/lib/theme";
import { ESTADO_TAREA_MAP } from "@/lib/constants";
import type { ProjectStage, Task } from "@/lib/types";

const toDay = (d: string) => Math.floor(Date.parse(d + "T00:00:00Z") / 86400000);
const fmt = (day: number) => new Date(day * 86400000).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });

export default function GanttView({ stages, tasks }: { stages: ProjectStage[]; tasks: Task[] }) {
  const { min, span, rows, hasDates } = useMemo(() => {
    const days: number[] = [];
    const taskRange = (t: Task) => {
      const s = t.fecha_inicio ?? t.fecha_limite;
      const e = t.fecha_limite ?? t.fecha_inicio;
      return s && e ? { s: toDay(s), e: Math.max(toDay(s), toDay(e)) } : null;
    };
    for (const t of tasks) {
      const r = taskRange(t);
      if (r) days.push(r.s, r.e);
    }
    for (const st of stages) {
      if (st.fecha_inicio) days.push(toDay(st.fecha_inicio));
      if (st.fecha_fin) days.push(toDay(st.fecha_fin));
    }
    if (days.length === 0) return { min: 0, span: 1, rows: [], hasDates: false };
    const min = Math.min(...days);
    const max = Math.max(...days);
    const span = Math.max(1, max - min);

    const rows = stages.map((st) => {
      const sts = tasks.filter((t) => t.stage_id === st.id);
      const bars = sts
        .map((t) => {
          const r = taskRange(t);
          if (!r) return null;
          return { id: t.id, titulo: t.titulo, color: ESTADO_TAREA_MAP[t.estado].color, left: ((r.s - min) / span) * 100, width: (Math.max(1, r.e - r.s) / span) * 100 };
        })
        .filter(Boolean) as { id: string; titulo: string; color: string; left: number; width: number }[];
      return { stage: st, bars };
    });
    return { min, span, rows, hasDates: true };
  }, [stages, tasks]);

  if (!hasDates) {
    return (
      <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 14, padding: 40, textAlign: "center", color: theme.textMuted, fontSize: 14 }}>
        Agrega <strong>fechas</strong> (inicio / límite) a las tareas para ver la línea de tiempo.
      </div>
    );
  }

  const max = min + span;

  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.textFaint, marginBottom: 12, paddingLeft: 180 }}>
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 560 }}>
        {rows.map(({ stage, bars }) => (
          <div key={stage.id} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 168, flexShrink: 0, fontSize: 13, fontWeight: 600, paddingTop: 2 }}>{stage.nombre}</div>
            <div style={{ flex: 1, position: "relative", minHeight: bars.length ? bars.length * 26 : 14 }}>
              {bars.length === 0 && <div style={{ fontSize: 12, color: theme.textFaint }}>sin fechas</div>}
              {bars.map((b, i) => (
                <div
                  key={b.id}
                  title={b.titulo}
                  style={{
                    position: "absolute",
                    top: i * 26,
                    left: `${b.left}%`,
                    width: `${b.width}%`,
                    minWidth: 8,
                    height: 20,
                    background: `${b.color}cc`,
                    border: `1px solid ${b.color}`,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 6,
                    fontSize: 11,
                    color: "#0a0b0d",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                  }}
                >
                  {b.titulo}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
