"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, labelStyle, btnPrimary } from "@/lib/theme";
import { formatCLP, desglosaIVA, STORAGE_ATTACHMENTS } from "@/lib/constants";
import type { Purchase, FondoTipo } from "@/lib/types";

type MiniProject = { id: string; nombre: string };
type MiniUser = { id: string; full_name: string | null; email: string };

const fullRow: React.CSSProperties = { gridColumn: "1 / -1" };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CompraForm({
  projects,
  users,
  sociedadId,
  initial,
  onDone,
  onCancel,
}: {
  projects: MiniProject[];
  users: MiniUser[];
  sociedadId: string | null;
  initial?: Purchase;
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();

  const [fechaCompra, setFechaCompra] = useState(initial?.fecha_compra ?? todayISO());
  const [proveedor, setProveedor] = useState(initial?.proveedor ?? "");
  const [rutProveedor, setRutProveedor] = useState(initial?.rut_proveedor ?? "");
  const [monto, setMonto] = useState(initial ? String(initial.monto_total) : "");
  const [tieneIva, setTieneIva] = useState(initial?.tiene_iva ?? true);
  const [conFactura, setConFactura] = useState(initial?.con_factura ?? true);
  const [facturaASociedad, setFacturaASociedad] = useState(initial?.factura_a_sociedad ?? true);
  const [folio, setFolio] = useState(initial?.folio_factura ?? "");
  const [proyectoId, setProyectoId] = useState(initial?.proyecto_id ?? "");
  const [usoTipo, setUsoTipo] = useState<"sociedad" | "usuario">(
    initial && initial.imputacion_tipo === "usuario" ? "usuario" : "sociedad"
  );
  const [usoUserId, setUsoUserId] = useState(initial?.uso_user_id ?? "");
  const [fondoTipo, setFondoTipo] = useState<FondoTipo>(initial?.fondo_tipo ?? "sociedad");
  const [fondoUserId, setFondoUserId] = useState(initial?.fondo_user_id ?? "");
  const [fechaPago, setFechaPago] = useState(initial?.fecha_pago ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoNum = Number(monto) || 0;
  const desglose = desglosaIVA(montoNum, tieneIva);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let fotoPath = initial?.foto_path ?? null;
      if (file) {
        const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `compras/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage.from(STORAGE_ATTACHMENTS).upload(path, file);
        if (upErr) throw upErr;
        fotoPath = path;
      }

      const payload = {
        fecha_compra: fechaCompra || null,
        proveedor: proveedor.trim() || null,
        rut_proveedor: rutProveedor.trim() || null,
        monto_total: montoNum,
        tiene_iva: tieneIva,
        con_factura: conFactura,
        factura_a_sociedad: conFactura ? facturaASociedad : false,
        folio_factura: conFactura ? folio.trim() || null : null,
        imputacion_tipo: proyectoId ? "proyecto" : usoTipo,
        proyecto_id: proyectoId || null,
        uso_user_id: !proyectoId && usoTipo === "usuario" ? usoUserId || null : null,
        fondo_tipo: fondoTipo,
        fondo_user_id: fondoTipo === "usuario" ? fondoUserId || null : null,
        sociedad_id: sociedadId,
        fecha_pago: fechaPago || null,
        descripcion: descripcion.trim() || null,
        foto_path: fotoPath,
      };

      if (initial) {
        const { error: e2 } = await supabase.from("purchases").update(payload).eq("id", initial.id);
        if (e2) throw e2;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { error: e2 } = await supabase.from("purchases").insert({ ...payload, created_by: user?.id ?? null });
        if (e2) throw e2;
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la compra");
      setSaving(false);
    }
  }

  const userOptions = users.map((u) => (
    <option key={u.id} value={u.id} style={{ background: theme.surfaceSolid }}>
      {u.full_name || u.email}
    </option>
  ));

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <label style={labelStyle}>Fecha de compra</label>
        <input type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Monto total (CLP)</label>
        <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="numeric" placeholder="Ej: 119000" style={inputStyle} />
        {montoNum > 0 && (
          <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>
            {tieneIva ? `Neto ${formatCLP(desglose.neto)} · IVA ${formatCLP(desglose.iva)}` : "Sin IVA"}
          </div>
        )}
      </div>

      <div>
        <label style={labelStyle}>Proveedor</label>
        <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Nombre del proveedor" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>RUT proveedor</label>
        <input value={rutProveedor} onChange={(e) => setRutProveedor(e.target.value)} placeholder="76.123.456-7" style={inputStyle} />
      </div>

      {/* Documento tributario */}
      <div style={{ ...fullRow, display: "flex", gap: 22, flexWrap: "wrap", padding: "4px 0", borderTop: `1px solid ${theme.border}`, paddingTop: 14 }}>
        <Check label="Afecto a IVA (19%)" checked={tieneIva} onChange={setTieneIva} />
        <Check label="Con factura" checked={conFactura} onChange={setConFactura} />
        {conFactura && <Check label="Factura a la sociedad" checked={facturaASociedad} onChange={setFacturaASociedad} />}
      </div>
      {conFactura && (
        <div style={fullRow}>
          <label style={labelStyle}>Folio factura</label>
          <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="N° de folio" style={{ ...inputStyle, maxWidth: 240 }} />
        </div>
      )}

      {/* Imputación */}
      <div style={fullRow}>
        <label style={labelStyle}>Proyecto</label>
        <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
          <option value="" style={{ background: theme.surfaceSolid }}>
            — Ninguno (gasto general) —
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id} style={{ background: theme.surfaceSolid }}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>

      {!proyectoId && (
        <div style={fullRow}>
          <label style={labelStyle}>Si no es un proyecto, ¿para qué es el gasto?</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Radio name="uso" label="Sociedad (admin/operación)" checked={usoTipo === "sociedad"} onChange={() => setUsoTipo("sociedad")} />
            <Radio name="uso" label="Usuario (personal)" checked={usoTipo === "usuario"} onChange={() => setUsoTipo("usuario")} />
            {usoTipo === "usuario" && (
              <select value={usoUserId} onChange={(e) => setUsoUserId(e.target.value)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
                <option value="" style={{ background: theme.surfaceSolid }}>
                  — elige usuario —
                </option>
                {userOptions}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Fondos */}
      <div style={fullRow}>
        <label style={labelStyle}>¿Quién pagó? (fondos)</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Radio name="fondo" label="La sociedad" checked={fondoTipo === "sociedad"} onChange={() => setFondoTipo("sociedad")} />
          <Radio name="fondo" label="Un usuario" checked={fondoTipo === "usuario"} onChange={() => setFondoTipo("usuario")} />
          {fondoTipo === "usuario" && (
            <select value={fondoUserId} onChange={(e) => setFondoUserId(e.target.value)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
              <option value="" style={{ background: theme.surfaceSolid }}>
                — elige usuario —
              </option>
              {userOptions}
            </select>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Fecha de pago</label>
        <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} style={inputStyle} />
        <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>Déjala vacía si aún no se paga (queda pendiente).</div>
      </div>
      <div>
        <label style={labelStyle}>Foto / comprobante</label>
        <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: 8 }} />
        {initial?.foto_path && !file && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>Ya hay un archivo adjunto (sube otro para reemplazar).</div>}
      </div>

      <div style={fullRow}>
        <label style={labelStyle}>Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Detalle de la compra…" style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {error && <div style={{ ...fullRow, color: "#fca5a5", fontSize: 13 }}>{error}</div>}

      <div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="es-btn" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: theme.text, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function Radio({ name, label, checked, onChange }: { name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: theme.text, cursor: "pointer" }}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
