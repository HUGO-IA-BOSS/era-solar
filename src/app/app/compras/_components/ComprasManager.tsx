"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Paperclip } from "lucide-react";
import Modal from "@/app/app/_components/Modal";
import { StatCard, EmptyState } from "@/app/app/_components/ui";
import { createClient } from "@/lib/supabase/client";
import { theme, btnPrimary } from "@/lib/theme";
import { formatCLP, desglosaIVA, IMPUTACION_LABEL, STORAGE_ATTACHMENTS } from "@/lib/constants";
import type { Purchase } from "@/lib/types";
import CompraForm from "./CompraForm";

type MiniProject = { id: string; nombre: string };
type MiniUser = { id: string; full_name: string | null; email: string };

export default function ComprasManager({
  purchases,
  projects,
  users,
  sociedadId,
}: {
  purchases: Purchase[];
  projects: MiniProject[];
  users: MiniUser[];
  sociedadId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [busy, setBusy] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.nombre])), [projects]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u.full_name || u.email])), [users]);

  const totals = useMemo(() => {
    let total = 0,
      ivaCredito = 0,
      pendiente = 0;
    for (const p of purchases) {
      total += p.monto_total ?? 0;
      if (p.con_factura && p.factura_a_sociedad && p.tiene_iva) {
        ivaCredito += desglosaIVA(p.monto_total ?? 0, true).iva;
      }
      if (!p.fecha_pago) pendiente += p.monto_total ?? 0;
    }
    return { total, ivaCredito, pendiente };
  }, [purchases]);

  function imputacionText(p: Purchase) {
    if (p.imputacion_tipo === "proyecto") return projectMap.get(p.proyecto_id ?? "") ?? "Proyecto";
    if (p.imputacion_tipo === "usuario") return `Personal · ${userMap.get(p.uso_user_id ?? "") ?? "—"}`;
    return IMPUTACION_LABEL.sociedad;
  }
  function fondoText(p: Purchase) {
    return p.fondo_tipo === "usuario" ? userMap.get(p.fondo_user_id ?? "") ?? "Usuario" : "Sociedad";
  }

  async function verFoto(p: Purchase) {
    if (!p.foto_path) return;
    const { data } = await supabase.storage.from(STORAGE_ATTACHMENTS).createSignedUrl(p.foto_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function eliminar(p: Purchase) {
    if (!confirm("¿Eliminar esta compra?")) return;
    setBusy(true);
    if (p.foto_path) await supabase.storage.from(STORAGE_ATTACHMENTS).remove([p.foto_path]);
    await supabase.from("purchases").delete().eq("id", p.id);
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: 12, flex: 1, minWidth: 280 }}>
          <StatCard label="Total comprado" value={formatCLP(totals.total)} />
          <StatCard label="IVA crédito" value={formatCLP(totals.ivaCredito)} accent="#3b82f6" hint="facturas a la sociedad" />
          <StatCard label="Pendiente de pago" value={formatCLP(totals.pendiente)} accent={theme.danger} />
        </div>
        <button onClick={() => setCreating(true)} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Plus size={18} /> Nueva compra
        </button>
      </div>

      {purchases.length === 0 ? (
        <EmptyState title="Aún no hay compras" description="Registra tu primera compra con el botón “Nueva compra”." />
      ) : (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "92px 1.4fr 1.3fr 1fr 110px 96px", gap: 12, padding: "11px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: theme.textFaint, borderBottom: `1px solid ${theme.border}`, background: theme.bgElev }}>
            <div>Fecha</div>
            <div>Proveedor</div>
            <div>Imputación</div>
            <div>Pagó</div>
            <div style={{ textAlign: "right" }}>Monto</div>
            <div style={{ textAlign: "right" }}>Acciones</div>
          </div>
          {purchases.map((p) => (
            <div key={p.id} className="es-row" style={{ display: "grid", gridTemplateColumns: "92px 1.4fr 1.3fr 1fr 110px 96px", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, fontSize: 13.5 }}>
              <div style={{ color: theme.textMuted }}>
                {p.fecha_compra ? new Date(p.fecha_compra + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.proveedor || "—"}</div>
                <div style={{ fontSize: 12, color: theme.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.descripcion || (p.con_factura ? `Factura ${p.folio_factura ?? ""}` : "Sin factura")}
                </div>
              </div>
              <div style={{ color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{imputacionText(p)}</div>
              <div style={{ color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fondoText(p)}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 600 }}>{formatCLP(p.monto_total)}</div>
                <div style={{ fontSize: 11, color: p.fecha_pago ? theme.ok : theme.accent }}>{p.fecha_pago ? "Pagado" : "Pendiente"}</div>
              </div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {p.foto_path && (
                  <button onClick={() => verFoto(p)} title="Ver comprobante" style={iconBtn}>
                    <Paperclip size={15} />
                  </button>
                )}
                <button onClick={() => setEditing(p)} title="Editar" style={iconBtn}>
                  <Pencil size={15} />
                </button>
                <button onClick={() => eliminar(p)} title="Eliminar" style={{ ...iconBtn, color: "#fca5a5" }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva compra" width={720}>
        <CompraForm projects={projects} users={users} sociedadId={sociedadId} onDone={done} onCancel={() => setCreating(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar compra" width={720}>
        {editing && <CompraForm projects={projects} users={users} sociedadId={sociedadId} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}
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
