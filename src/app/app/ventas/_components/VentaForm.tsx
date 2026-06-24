"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, labelStyle, btnPrimary } from "@/lib/theme";
import { formatCLP, desglosaIVA, MEDIO_PAGO_OPTIONS, STORAGE_ATTACHMENTS } from "@/lib/constants";
import type { Sale, SaleAllocation, Cuota, MedioPago, FondoTipo } from "@/lib/types";

type MiniProject = { id: string; nombre: string };
type MiniUser = { id: string; full_name: string | null; email: string };

const fullRow: React.CSSProperties = { gridColumn: "1 / -1" };
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function VentaForm({
  projects,
  users,
  sociedadId,
  initial,
  initialAllocations,
  prefill,
  lockProject,
  onDone,
  onCancel,
}: {
  projects: MiniProject[];
  users: MiniUser[];
  sociedadId: string | null;
  initial?: Sale;
  initialAllocations?: SaleAllocation[];
  prefill?: { proyecto_id: string; allocations?: { cuota_id: string; monto: number }[] };
  lockProject?: boolean;
  onDone: () => void;
  onCancel: () => void;
}) {
  const supabase = createClient();

  const [proyectoId, setProyectoId] = useState(initial?.proyecto_id ?? prefill?.proyecto_id ?? "");
  const [monto, setMonto] = useState(initial ? String(initial.monto_total) : "");
  const [montoTouched, setMontoTouched] = useState(!!initial);
  const [tieneIva, setTieneIva] = useState(initial?.tiene_iva ?? true);
  const [medioPago, setMedioPago] = useState<MedioPago>(initial?.medio_pago ?? "transferencia");
  const [fechaPago, setFechaPago] = useState(initial?.fecha_pago ?? todayISO());
  const [destinoTipo, setDestinoTipo] = useState<FondoTipo>(initial?.destino_tipo ?? "sociedad");
  const [destinoUserId, setDestinoUserId] = useState(initial?.destino_user_id ?? "");
  const [folio, setFolio] = useState(initial?.folio_factura ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  // Asignación a cuotas: { cuota_id: monto(string) } — presencia = marcada
  const initAllocs: Record<string, string> = {};
  (initialAllocations ?? []).forEach((a) => (initAllocs[a.cuota_id] = String(a.monto)));
  (prefill?.allocations ?? []).forEach((a) => (initAllocs[a.cuota_id] = String(a.monto)));
  const [allocs, setAllocs] = useState<Record<string, string>>(initAllocs);

  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [pagadoPrevio, setPagadoPrevio] = useState<Record<string, number>>({}); // abonos de OTRAS ventas

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar cuotas del proyecto + abonos previos (excluyendo esta venta)
  useEffect(() => {
    let active = true;
    (async () => {
      if (!proyectoId) {
        setCuotas([]);
        setPagadoPrevio({});
        return;
      }
      const { data: cs } = await supabase.from("cuotas").select("*").eq("project_id", proyectoId).order("orden");
      if (!active) return;
      const list = (cs ?? []) as Cuota[];
      setCuotas(list);
      const ids = list.map((c) => c.id);
      if (ids.length) {
        const { data: al } = await supabase.from("sale_allocations").select("cuota_id, monto, sale_id").in("cuota_id", ids);
        if (!active) return;
        const paid: Record<string, number> = {};
        for (const a of (al ?? []) as { cuota_id: string; monto: number; sale_id: string }[]) {
          if (initial && a.sale_id === initial.id) continue; // excluye esta venta
          paid[a.cuota_id] = (paid[a.cuota_id] ?? 0) + (a.monto ?? 0);
        }
        setPagadoPrevio(paid);
      } else {
        setPagadoPrevio({});
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  const saldoDe = (c: Cuota) => Math.max(0, (c.monto ?? 0) - (pagadoPrevio[c.id] ?? 0));
  const asignado = Object.values(allocs).reduce((s, v) => s + (Number(v) || 0), 0);
  const montoNum = Number(monto) || 0;
  const desglose = desglosaIVA(montoNum, tieneIva);

  function toggleCuota(c: Cuota, checked: boolean) {
    setAllocs((prev) => {
      const next = { ...prev };
      if (checked) next[c.id] = String(saldoDe(c) || c.monto || 0);
      else delete next[c.id];
      // sincroniza el monto total si el usuario no lo editó a mano
      if (!montoTouched) {
        const total = Object.values(next).reduce((s, v) => s + (Number(v) || 0), 0);
        setMonto(total ? String(total) : "");
      }
      return next;
    });
  }
  function setAllocMonto(id: string, val: string) {
    setAllocs((prev) => {
      const next = { ...prev, [id]: val };
      if (!montoTouched) {
        const total = Object.values(next).reduce((s, v) => s + (Number(v) || 0), 0);
        setMonto(total ? String(total) : "");
      }
      return next;
    });
  }

  async function uploadIf(file: File | null, current: string | null): Promise<string | null> {
    if (!file) return current ?? null;
    const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `ventas/${crypto.randomUUID()}-${safe}`;
    const { error: e } = await supabase.storage.from(STORAGE_ATTACHMENTS).upload(path, file);
    if (e) throw e;
    return path;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!proyectoId) return setError("Selecciona un proyecto.");
    if (montoNum <= 0) return setError("Ingresa el monto total de la venta.");
    if (asignado > montoNum + 0.5) return setError("Lo asignado a cuotas no puede superar el monto total.");
    if (destinoTipo === "usuario" && !destinoUserId) return setError("Elige el usuario destino de los fondos.");

    setSaving(true);
    try {
      const factura_path = await uploadIf(facturaFile, initial?.factura_path ?? null);
      const comprobante_path = await uploadIf(comprobanteFile, initial?.comprobante_path ?? null);

      const payload = {
        proyecto_id: proyectoId,
        monto_total: montoNum,
        tiene_iva: tieneIva,
        medio_pago: medioPago,
        fecha_pago: fechaPago || null,
        destino_tipo: destinoTipo,
        destino_user_id: destinoTipo === "usuario" ? destinoUserId || null : null,
        sociedad_id: sociedadId,
        folio_factura: folio.trim() || null,
        factura_path,
        comprobante_path,
        descripcion: descripcion.trim() || null,
      };

      let saleId = initial?.id;
      if (initial) {
        const { error: e2 } = await supabase.from("sales").update(payload).eq("id", initial.id);
        if (e2) throw e2;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data, error: e2 } = await supabase
          .from("sales")
          .insert({ ...payload, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (e2) throw e2;
        saleId = data.id;
      }

      // Reemplaza las asignaciones de esta venta
      await supabase.from("sale_allocations").delete().eq("sale_id", saleId!);
      const rows = Object.entries(allocs)
        .map(([cuota_id, v]) => ({ sale_id: saleId!, cuota_id, monto: Number(v) || 0 }))
        .filter((r) => r.monto > 0);
      if (rows.length) {
        const { error: e3 } = await supabase.from("sale_allocations").insert(rows);
        if (e3) throw e3;
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la venta");
      setSaving(false);
    }
  }

  const projectName = projects.find((p) => p.id === proyectoId)?.nombre ?? "";

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={fullRow}>
        <label style={labelStyle}>Proyecto *</label>
        {lockProject ? (
          <div style={{ ...inputStyle, color: theme.text, opacity: 0.85 }}>{projectName}</div>
        ) : (
          <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
            <option value="" style={{ background: theme.surfaceSolid }}>
              — elige proyecto —
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id} style={{ background: theme.surfaceSolid }}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Asignación a cuotas */}
      {proyectoId && (
        <div style={{ ...fullRow, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.textMuted, marginBottom: 10 }}>
            Asignar a cuotas {cuotas.length === 0 && "— este proyecto no tiene cuotas (puedes registrar la venta igual)"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cuotas.map((c) => {
              const checked = c.id in allocs;
              const saldo = saldoDe(c);
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, cursor: "pointer", fontSize: 13.5 }}>
                    <input type="checkbox" checked={checked} onChange={(e) => toggleCuota(c, e.target.checked)} />
                    <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                    <span style={{ color: theme.textFaint, fontSize: 12 }}>
                      cuota {formatCLP(c.monto)} · saldo {formatCLP(saldo)}
                    </span>
                  </label>
                  {checked && (
                    <input
                      value={allocs[c.id] ?? ""}
                      onChange={(e) => setAllocMonto(c.id, e.target.value)}
                      inputMode="numeric"
                      placeholder="Monto abono"
                      style={{ ...inputStyle, width: 150 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {Object.keys(allocs).length > 0 && (
            <div style={{ fontSize: 12.5, color: asignado > montoNum + 0.5 ? theme.danger : theme.textMuted, marginTop: 10 }}>
              Asignado {formatCLP(asignado)} de {formatCLP(montoNum)}
              {asignado > montoNum + 0.5 && " — excede el monto total"}
            </div>
          )}
        </div>
      )}

      <div>
        <label style={labelStyle}>Monto total recibido (CLP)</label>
        <input
          value={monto}
          onChange={(e) => {
            setMonto(e.target.value);
            setMontoTouched(true);
          }}
          inputMode="numeric"
          placeholder="Ej: 1190000"
          style={inputStyle}
        />
        {montoNum > 0 && (
          <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>
            {tieneIva ? `Neto ${formatCLP(desglose.neto)} · IVA ${formatCLP(desglose.iva)}` : "Sin IVA"}
          </div>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13, color: theme.textMuted, cursor: "pointer" }}>
          <input type="checkbox" checked={tieneIva} onChange={(e) => setTieneIva(e.target.checked)} /> Afecto a IVA (19%)
        </label>
      </div>
      <div>
        <label style={labelStyle}>Medio de pago</label>
        <select value={medioPago} onChange={(e) => setMedioPago(e.target.value as MedioPago)} style={{ ...inputStyle, appearance: "auto" }}>
          {MEDIO_PAGO_OPTIONS.map((m) => (
            <option key={m.value} value={m.value} style={{ background: theme.surfaceSolid }}>
              {m.label}
            </option>
          ))}
        </select>
        <label style={{ ...labelStyle, marginTop: 12 }}>Fecha de pago</label>
        <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} style={inputStyle} />
      </div>

      {/* Destino de fondos */}
      <div style={fullRow}>
        <label style={labelStyle}>¿A dónde van los fondos?</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={radioL}>
            <input type="radio" name="destino" checked={destinoTipo === "sociedad"} onChange={() => setDestinoTipo("sociedad")} /> Cuenta de la sociedad
          </label>
          <label style={radioL}>
            <input type="radio" name="destino" checked={destinoTipo === "usuario"} onChange={() => setDestinoTipo("usuario")} /> Cuenta de un usuario
          </label>
          {destinoTipo === "usuario" && (
            <select value={destinoUserId} onChange={(e) => setDestinoUserId(e.target.value)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
              <option value="" style={{ background: theme.surfaceSolid }}>
                — elige usuario —
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id} style={{ background: theme.surfaceSolid }}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Folio factura</label>
        <input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="N° de folio" style={inputStyle} />
      </div>
      <div />

      <div>
        <label style={labelStyle}>PDF de la factura</label>
        <input type="file" accept="application/pdf,image/*" onChange={(e) => setFacturaFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: 8 }} />
        {initial?.factura_path && !facturaFile && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>Ya hay factura adjunta.</div>}
      </div>
      <div>
        <label style={labelStyle}>Comprobante de pago</label>
        <input type="file" accept="application/pdf,image/*" onChange={(e) => setComprobanteFile(e.target.files?.[0] ?? null)} style={{ ...inputStyle, padding: 8 }} />
        {initial?.comprobante_path && !comprobanteFile && <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 6 }}>Ya hay comprobante adjunto.</div>}
      </div>

      <div style={fullRow}>
        <label style={labelStyle}>Descripción</label>
        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} placeholder="Detalle de la venta / pago…" style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      {error && <div style={{ ...fullRow, color: "#fca5a5", fontSize: 13 }}>{error}</div>}

      <div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="es-btn" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Registrar venta"}
        </button>
      </div>
    </form>
  );
}

const radioL: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: theme.text, cursor: "pointer" };
