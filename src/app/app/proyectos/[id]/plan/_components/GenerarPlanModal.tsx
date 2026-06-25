"use client";

import { useState } from "react";
import Modal from "../../../../_components/Modal";
import { theme, inputStyle, btnPrimary } from "@/lib/theme";
import { DEFAULT_PLAN } from "@/lib/plan-template";

function defaultFechas(): string[] {
  const base = new Date();
  return DEFAULT_PLAN.map((_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i * 7);
    return d.toISOString().slice(0, 10);
  });
}

export default function GenerarPlanModal({
  mode,
  working,
  error,
  onConfirm,
  onClose,
}: {
  mode: "generar" | "regenerar";
  working: boolean;
  error?: string | null;
  onConfirm: (fechas: string[]) => void;
  onClose: () => void;
}) {
  const [fechas, setFechas] = useState<string[]>(defaultFechas());

  return (
    <Modal open onClose={onClose} title={mode === "generar" ? "Generar plan" : "Regenerar plan"} width={560}>
      <p style={{ fontSize: 13.5, color: theme.textMuted, margin: "0 0 4px" }}>
        Pon una <strong>fecha tentativa de inicio</strong> para cada etapa. Con eso se reparten las fechas de las
        tareas y se arma el Gantt (todo editable después).
      </p>
      {mode === "regenerar" && (
        <p style={{ fontSize: 13, color: theme.accent, margin: "0 0 14px" }}>
          ⚠️ Se borrará el plan actual (etapas, tareas y checklist) y se recreará desde la plantilla.
        </p>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        {DEFAULT_PLAN.map((st, i) => (
          <div key={st.nombre} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, minWidth: 0 }}>
              <span style={{ color: theme.textFaint, fontWeight: 400, marginRight: 6 }}>{i + 1}.</span>
              {st.nombre}
            </span>
            <input
              type="date"
              value={fechas[i] ?? ""}
              onChange={(e) => setFechas((prev) => prev.map((f, j) => (j === i ? e.target.value : f)))}
              style={{ ...inputStyle, width: 170 }}
            />
          </div>
        ))}
      </div>
      {error && (
        <div style={{ marginTop: 14, color: "#fca5a5", fontSize: 13, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 12px" }}>
          {error}
          {/column .* does not exist|no existe la columna/i.test(error) && (
            <div style={{ marginTop: 6, color: theme.textMuted }}>
              Parece que falta correr la migración <strong>0005_plan_deps.sql</strong> en Supabase.
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
        <button onClick={() => onConfirm(fechas)} disabled={working} className="es-btn" style={{ ...btnPrimary, opacity: working ? 0.7 : 1, cursor: working ? "wait" : "pointer" }}>
          {working ? "Generando…" : mode === "generar" ? "Generar plan" : "Regenerar"}
        </button>
      </div>
    </Modal>
  );
}
