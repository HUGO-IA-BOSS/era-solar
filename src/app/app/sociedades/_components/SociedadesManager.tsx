"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, labelStyle, btnPrimary } from "@/lib/theme";
import type { Sociedad } from "@/lib/types";

export default function SociedadesManager({ sociedades }: { sociedades: Sociedad[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoRut, setNuevoRut] = useState("");

  async function guardar(id: string, nombre: string, rut: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("sociedades").update({ nombre: nombre.trim(), rut: rut.trim() || null }).eq("id", id);
    setBusy(false);
    if (error) setError(error.message);
    else router.refresh();
  }
  async function agregar() {
    if (!nuevoNombre.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("sociedades").insert({ nombre: nuevoNombre.trim(), rut: nuevoRut.trim() || null });
    setBusy(false);
    if (error) setError(error.message);
    else {
      setNuevoNombre("");
      setNuevoRut("");
      router.refresh();
    }
  }
  async function eliminar(id: string) {
    if (!confirm("¿Eliminar esta sociedad? Las compras asociadas quedarán sin sociedad.")) return;
    setBusy(true);
    await supabase.from("sociedades").delete().eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640, opacity: busy ? 0.8 : 1 }}>
      {error && <div style={{ color: "#fca5a5", fontSize: 13 }}>{error}</div>}

      {sociedades.map((s) => (
        <SociedadRow key={s.id} sociedad={s} onSave={guardar} onDelete={eliminar} busy={busy} />
      ))}

      <div style={{ border: `1px dashed ${theme.borderStrong}`, borderRadius: 14, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: theme.textMuted }}>
          <Plus size={16} /> <span style={{ fontSize: 14, fontWeight: 600 }}>Agregar sociedad</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Razón social" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>RUT</label>
            <input value={nuevoRut} onChange={(e) => setNuevoRut(e.target.value)} placeholder="76.123.456-7" style={inputStyle} />
          </div>
          <button onClick={agregar} disabled={busy} className="es-btn" style={{ ...btnPrimary, height: 40 }}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function SociedadRow({
  sociedad,
  onSave,
  onDelete,
  busy,
}: {
  sociedad: Sociedad;
  onSave: (id: string, nombre: string, rut: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [nombre, setNombre] = useState(sociedad.nombre);
  const [rut, setRut] = useState(sociedad.rut ?? "");
  const dirty = nombre !== sociedad.nombre || rut !== (sociedad.rut ?? "");

  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 14, padding: 18, background: theme.surface }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: theme.accentSoft, color: theme.accent }}>
          <Building2 size={18} />
        </span>
        <div style={{ fontWeight: 700 }}>{sociedad.nombre}</div>
        <button onClick={() => onDelete(sociedad.id)} disabled={busy} title="Eliminar" style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${theme.border}`, borderRadius: 8, width: 32, height: 32, display: "grid", placeItems: "center", color: "#fca5a5", cursor: "pointer" }}>
          <Trash2 size={15} />
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, alignItems: "end" }}>
        <div>
          <label style={labelStyle}>Nombre / Razón social</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>RUT</label>
          <input value={rut} onChange={(e) => setRut(e.target.value)} placeholder="76.123.456-7" style={inputStyle} />
        </div>
        <button
          onClick={() => onSave(sociedad.id, nombre, rut)}
          disabled={busy || !dirty}
          className="es-btn"
          style={{ ...btnPrimary, height: 40, display: "inline-flex", alignItems: "center", gap: 7, opacity: dirty ? 1 : 0.5, cursor: dirty ? "pointer" : "default" }}
        >
          <Save size={15} /> Guardar
        </button>
      </div>
    </div>
  );
}
