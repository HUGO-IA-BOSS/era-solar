"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, FileText, Paperclip } from "lucide-react";
import Modal from "@/app/app/_components/Modal";
import { StatCard, EmptyState } from "@/app/app/_components/ui";
import { createClient } from "@/lib/supabase/client";
import { theme, btnPrimary } from "@/lib/theme";
import { formatCLP, desglosaIVA, MEDIO_PAGO_LABEL, STORAGE_ATTACHMENTS } from "@/lib/constants";
import type { Sale, SaleAllocation } from "@/lib/types";
import VentaForm from "./VentaForm";

type MiniProject = { id: string; nombre: string };
type MiniUser = { id: string; full_name: string | null; email: string };

export default function VentasManager({
  sales,
  allocations,
  projects,
  users,
  sociedadId,
}: {
  sales: Sale[];
  allocations: SaleAllocation[];
  projects: MiniProject[];
  users: MiniUser[];
  sociedadId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.nombre])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name || u.email])), [users]);
  const allocBySale = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of allocations) m.set(a.sale_id, (m.get(a.sale_id) ?? 0) + 1);
    return m;
  }, [allocations]);

  const totals = useMemo(() => {
    let total = 0,
      iva = 0;
    for (const s of sales) {
      total += s.monto_total ?? 0;
      if (s.tiene_iva) iva += desglosaIVA(s.monto_total ?? 0, true).iva;
    }
    return { total, iva, count: sales.length };
  }, [sales]);

  async function openFile(path: string | null) {
    if (!path) return;
    const { data } = await supabase.storage.from(STORAGE_ATTACHMENTS).createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function eliminar(s: Sale) {
    if (!confirm("¿Eliminar esta venta? Se quitarán sus abonos de las cuotas.")) return;
    setBusy(true);
    const files = [s.factura_path, s.comprobante_path].filter(Boolean) as string[];
    if (files.length) await supabase.storage.from(STORAGE_ATTACHMENTS).remove(files);
    await supabase.from("sales").delete().eq("id", s.id); // allocations caen por cascade
    setBusy(false);
    router.refresh();
  }

  function done() {
    setCreating(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div style={{ opacity: busy ? 0.7 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(150px, 1fr))", gap: 12, flex: 1, minWidth: 280 }}>
          <StatCard label="Total ventas" value={formatCLP(totals.total)} accent={theme.ok} />
          <StatCard label="IVA débito" value={formatCLP(totals.iva)} accent="#3b82f6" />
          <StatCard label="N° de ventas" value={String(totals.count)} />
        </div>
        <button onClick={() => setCreating(true)} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} /> Nueva venta
        </button>
      </div>

      {sales.length === 0 ? (
        <EmptyState title="Aún no hay ventas" description="Registra tu primera venta con el botón “Nueva venta”." />
      ) : (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "92px 1.5fr 1.1fr 86px 130px 96px", gap: 12, padding: "11px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textFaint, borderBottom: `1px solid ${theme.border}`, background: theme.bgElev }}>
            <div>Fecha</div>
            <div>Proyecto</div>
            <div>Destino</div>
            <div style={{ textAlign: "center" }}>Cuotas</div>
            <div style={{ textAlign: "right" }}>Monto</div>
            <div style={{ textAlign: "right" }}>Acciones</div>
          </div>
          {sales.map((s) => (
            <div key={s.id} className="es-row" style={{ display: "grid", gridTemplateColumns: "92px 1.5fr 1.1fr 86px 130px 96px", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, fontSize: 13.5 }}>
              <div style={{ color: theme.textMuted }}>
                {s.fecha_pago ? new Date(s.fecha_pago + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {projectMap.get(s.proyecto_id ?? "") ?? "Sin proyecto"}
                </div>
                <div style={{ fontSize: 12, color: theme.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.descripcion || (s.folio_factura ? `Factura ${s.folio_factura}` : MEDIO_PAGO_LABEL[s.medio_pago])}
                </div>
              </div>
              <div style={{ color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.destino_tipo === "usuario" ? userMap.get(s.destino_user_id ?? "") ?? "Usuario" : "Sociedad"}
              </div>
              <div style={{ textAlign: "center", color: theme.textMuted }}>{allocBySale.get(s.id) ?? 0}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{formatCLP(s.monto_total)}</div>
                <div style={{ fontSize: 11, color: theme.textFaint }}>{MEDIO_PAGO_LABEL[s.medio_pago]}</div>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {s.factura_path && (
                  <button onClick={() => openFile(s.factura_path)} title="Ver factura" style={iconBtn}>
                    <FileText size={15} />
                  </button>
                )}
                {s.comprobante_path && (
                  <button onClick={() => openFile(s.comprobante_path)} title="Ver comprobante" style={iconBtn}>
                    <Paperclip size={15} />
                  </button>
                )}
                <button onClick={() => setEditing(s)} title="Editar" style={iconBtn}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => eliminar(s)} title="Eliminar" style={{ ...iconBtn, color: "#fca5a5" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva venta" width={760}>
        <VentaForm projects={projects} users={users} sociedadId={sociedadId} onDone={done} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar venta" width={760}>
        {editing && (
          <VentaForm
            projects={projects}
            users={users}
            sociedadId={sociedadId}
            initial={editing}
            initialAllocations={allocations.filter((a) => a.sale_id === editing.id)}
            onDone={done}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  color: theme.textMuted,
  cursor: "pointer",
};
