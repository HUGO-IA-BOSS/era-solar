"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS } from "@/lib/constants";
import { theme } from "@/lib/theme";
import type { EstadoProyecto } from "@/lib/types";
import { updateEstado } from "../../actions";

export default function EstadoSelector({ id, current }: { id: string; current: EstadoProyecto }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function change(value: EstadoProyecto) {
    if (value === current) return;
    start(async () => {
      await updateEstado(id, value);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: pending ? 0.6 : 1 }}>
      {ESTADOS.map((e) => {
        const active = e.value === current;
        return (
          <button
            key={e.value}
            onClick={() => change(e.value)}
            disabled={pending}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              cursor: pending ? "wait" : "pointer",
              textAlign: "left",
              border: `1px solid ${active ? e.color + "88" : theme.border}`,
              background: active ? e.color + "1f" : "transparent",
              color: active ? theme.text : theme.textMuted,
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
            {e.label}
            {active && <span style={{ marginLeft: "auto", fontSize: 11, color: e.color }}>● actual</span>}
          </button>
        );
      })}
    </div>
  );
}
