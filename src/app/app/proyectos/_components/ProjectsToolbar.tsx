"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { theme } from "@/lib/theme";
import { ESTADOS } from "@/lib/constants";

export default function ProjectsToolbar() {
  const router = useRouter();
  const params = useSearchParams();
  const estado = params.get("estado") ?? "";
  const [q, setQ] = useState(params.get("q") ?? "");
  const first = useRef(true);

  // Debounce de la búsqueda hacia la URL.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      if (q) sp.set("q", q);
      else sp.delete("q");
      router.replace(`/app/proyectos?${sp.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function setEstado(value: string) {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (value) sp.set("estado", value);
    else sp.delete("estado");
    router.replace(`/app/proyectos?${sp.toString()}`);
  }

  const pill = (active: boolean, color?: string): React.CSSProperties => ({
    padding: "7px 13px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${active ? (color ?? theme.accent) + "88" : theme.border}`,
    background: active ? (color ?? theme.accent) + "22" : "transparent",
    color: active ? theme.text : theme.textMuted,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
      <div style={{ position: "relative", maxWidth: 420 }}>
        <Search size={17} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: theme.textFaint }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, dirección o cliente…"
          style={{
            width: "100%",
            background: "#ffffff",
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "10px 12px 10px 38px",
            color: theme.text,
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => setEstado("")} style={pill(!estado)}>
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button key={e.value} onClick={() => setEstado(e.value)} style={pill(estado === e.value, e.color)}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
