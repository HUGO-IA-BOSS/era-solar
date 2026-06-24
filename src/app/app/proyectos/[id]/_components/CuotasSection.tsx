"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, CreditCard, Check, X } from "lucide-react";
import Modal from "@/app/app/_components/Modal";
import VentaForm from "@/app/app/ventas/_components/VentaForm";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle, btnPrimary } from "@/lib/theme";
import { formatCLP, IVA } from "@/lib/constants";
import type { Cuota, SaleAllocation } from "@/lib/types";

type MiniUser = { id: string; full_name: string | null; email: string };

export default function CuotasSection({
  projectId,
  projectNombre,
  valorNeto,
  cuotas,
  allocations,
  users,
  sociedadId,
}: {
  projectId: string;
  projectNombre: string;
  valorNeto: number | null;
  cuotas: Cuota[];
  allocations: SaleAllocation[];
  users: MiniUser[];
  sociedadId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paying, setPaying] = useState<Cuota | null>(null);

  const pagadoPorCuota = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of allocations) m.set(a.cuota_id, (m.get(a.cuota_id) ?? 0) + (a.monto ?? 0));
    return m;
  }, [allocations]);

  const sumaCuotas = cuotas.reduce((s, c) => s + (c.monto ?? 0), 0);
  const totalConIva = valorNeto != null ? Math.round(valorNeto * (1 + IVA)) : null;

  async function addCuota(nombre: string, monto: number, venc: string) {
    setBusy(true);
    await supabase.from("cuotas").insert({
      project_id: projectId,
      nombre: nombre || `Cuota ${cuotas.length + 1}`,
      monto,
      fecha_vencimiento: venc || null,
      orden: cuotas.length,
    });
    setBusy(false);
    setAdding(false);
    router.refresh();
  }
  async function saveCuota(id: string, nombre: string, monto: number, venc: string) {
    setBusy(true);
    await supabase.from("cuotas").update({ nombre, monto, fecha_vencimiento: venc || null }).eq("id", id);
    setBusy(false);
    setEditingId(null);
    router.refresh();
  }
  async function deleteCuota(id: string) {
    if (!confirm("¿Eliminar esta cuota? Se quitarán sus abonos.")) return;
    setBusy(true);
    await supabase.from("cuotas").delete().eq("id", id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div style={{ opacity: busy ? 0.75 : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cuotas.map((c) =>
          editingId === c.id ? (
            <CuotaEditor key={c.id} cuota={c} onCancel={() => setEditingId(null)} onSave={(n, m, v) => saveCuota(c.id, n, m, v)} />
          ) : (
            <CuotaRow
              key={c.id}
              cuota={c}
              pagado={pagadoPorCuota.get(c.id) ?? 0}
              onEdit={() => setEditingId(c.id)}
              onDelete={() => deleteCuota(c.id)}
              onPay={() => setPaying(c)}
            />
          )
        )}
      </div>

      {adding ? (
        <div style={{ marginTop: 10 }}>
          <CuotaEditor onCancel={() => setAdding(false)} onSave={(n, m, v) => addCuota(n, m, v)} isNew />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="es-card-link"
          style={{ marginTop: 12, width: "100%", border: `1px dashed ${theme.borderStrong}`, borderRadius: 12, background: "transparent", color: theme.textMuted, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={18} color={theme.accent} /> Agregar cuota
        </button>
      )}

      {cuotas.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${theme.border}`, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
          <span style={{ color: theme.textMuted }}>
            Suma cuotas: <strong style={{ color: theme.text }}>{formatCLP(sumaCuotas)}</strong>
          </span>
          {totalConIva != null && (
            <span style={{ color: theme.textMuted }}>
              Valor proyecto (c/IVA): <strong style={{ color: theme.text }}>{formatCLP(totalConIva)}</strong>
              {Math.abs(sumaCuotas - totalConIva) > 1 && (
                <span style={{ color: theme.accent }}> · diferencia {formatCLP(sumaCuotas - totalConIva)}</span>
              )}
            </span>
          )}
        </div>
      )}

      <Modal open={!!paying} onClose={() => setPaying(null)} title="Registrar pago de cuota" width={760}>
        {paying && (
          <VentaForm
            projects={[{ id: projectId, nombre: projectNombre }]}
            users={users}
            sociedadId={sociedadId}
            lockProject
            prefill={{
              proyecto_id: projectId,
              allocations: [{ cuota_id: paying.id, monto: Math.max(0, (paying.monto ?? 0) - (pagadoPorCuota.get(paying.id) ?? 0)) }],
            }}
            onDone={() => {
              setPaying(null);
              router.refresh();
            }}
            onCancel={() => setPaying(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function estadoCuota(monto: number, pagado: number): { label: string; color: string } {
  if (pagado <= 0) return { label: "Pendiente", color: theme.textFaint };
  if (pagado < monto - 1) return { label: "Parcial", color: "#3b82f6" };
  return { label: "Pagada", color: theme.ok };
}

function CuotaRow({
  cuota,
  pagado,
  onEdit,
  onDelete,
  onPay,
}: {
  cuota: Cuota;
  pagado: number;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}) {
  const saldo = Math.max(0, (cuota.monto ?? 0) - pagado);
  const est = estadoCuota(cuota.monto ?? 0, pagado);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${theme.border}`, borderRadius: 12, background: theme.surface, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{cuota.nombre}</div>
        <div style={{ fontSize: 12, color: theme.textFaint }}>
          {formatCLP(cuota.monto)}
          {cuota.fecha_vencimiento && ` · vence ${new Date(cuota.fecha_vencimiento + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}`}
          {pagado > 0 && ` · pagado ${formatCLP(pagado)}`}
          {saldo > 0 && pagado > 0 && ` · saldo ${formatCLP(saldo)}`}
        </div>
      </div>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${est.color}1f`, color: est.color, border: `1px solid ${est.color}55`, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: est.color }} />
        {est.label}
      </span>
      {saldo > 0 && (
        <button onClick={onPay} title="Registrar pago" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: theme.accentSoft, color: theme.accent, border: `1px solid rgba(245,158,11,0.4)`, borderRadius: 9, padding: "7px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <CreditCard size={15} /> Registrar pago
        </button>
      )}
      <button onClick={onEdit} title="Editar" style={iconBtn}>
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} title="Eliminar" style={{ ...iconBtn, color: "#fca5a5" }}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function CuotaEditor({
  cuota,
  onSave,
  onCancel,
  isNew,
}: {
  cuota?: Cuota;
  onSave: (nombre: string, monto: number, venc: string) => void;
  onCancel: () => void;
  isNew?: boolean;
}) {
  const [nombre, setNombre] = useState(cuota?.nombre ?? "");
  const [monto, setMonto] = useState(cuota ? String(cuota.monto) : "");
  const [venc, setVenc] = useState(cuota?.fecha_vencimiento ?? "");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 10, alignItems: "end", padding: "12px 14px", border: `1px solid ${theme.borderStrong}`, borderRadius: 12, background: theme.surface }}>
      <div>
        <label style={miniLabel}>Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={isNew ? "Ej: Anticipo" : ""} style={inputStyle} />
      </div>
      <div>
        <label style={miniLabel}>Monto</label>
        <input value={monto} onChange={(e) => setMonto(e.target.value)} inputMode="numeric" placeholder="Ej: 1500000" style={inputStyle} />
      </div>
      <div>
        <label style={miniLabel}>Vence (opcional)</label>
        <input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onSave(nombre.trim(), Number(monto) || 0, venc)} title="Guardar" style={{ ...btnPrimary, height: 40, width: 42, padding: 0, display: "grid", placeItems: "center" }}>
          <Check size={18} />
        </button>
        <button onClick={onCancel} title="Cancelar" style={{ ...iconBtn, width: 42, height: 40 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  color: theme.textMuted,
  cursor: "pointer",
};
const miniLabel: React.CSSProperties = { display: "block", fontSize: 11, color: theme.textFaint, fontWeight: 600, marginBottom: 5 };
