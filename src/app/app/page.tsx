import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard, Card, SectionTitle, EstadoBadge, EmptyState } from "./_components/ui";
import { ESTADOS, formatCLP } from "@/lib/constants";
import { theme } from "@/lib/theme";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (projects ?? []) as Project[];

  const vendidos = list.filter((p) => ["aprobado", "en_instalacion", "instalado", "postventa"].includes(p.estado));
  const totalVendido = vendidos.reduce((s, p) => s + (p.valor_neto ?? 0), 0);
  const totalPaneles = list.reduce((s, p) => s + (p.cantidad_paneles ?? 0), 0);
  const totalKwp = list.reduce(
    (s, p) => s + ((p.cantidad_paneles ?? 0) * (p.potencia_panel_w ?? 0)) / 1000,
    0
  );
  const instalados = list.filter((p) => p.estado === "instalado" || p.estado === "postventa").length;

  const countByEstado = (e: string) => list.filter((p) => p.estado === e).length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Resumen general de tus proyectos fotovoltaicos" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <StatCard label="Proyectos totales" value={String(list.length)} hint={`${instalados} instalados`} />
        <StatCard
          label="Valor vendido (neto)"
          value={formatCLP(totalVendido)}
          hint={`${formatCLP(Math.round(totalVendido * 1.19))} con IVA`}
          accent={theme.ok}
        />
        <StatCard label="Potencia total" value={`${totalKwp.toLocaleString("es-CL", { maximumFractionDigits: 1 })} kWp`} hint={`${totalPaneles} paneles`} accent="#3b82f6" />
        <StatCard label="En negociación" value={String(countByEstado("cotizacion") + countByEstado("aprobado"))} hint="Cotización + aprobados" accent={theme.accent} />
      </div>

      <Card style={{ marginBottom: 28 }}>
        <SectionTitle>Pipeline</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {ESTADOS.map((e) => {
            const c = countByEstado(e.value);
            return (
              <Link
                key={e.value}
                href={`/app/proyectos?estado=${e.value}`}
                className="es-card-link"
                style={{
                  textDecoration: "none",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  background: theme.surface,
                  display: "block",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color }} />
                  <span style={{ fontSize: 13, color: theme.textMuted, fontWeight: 600 }}>{e.label}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: theme.text }}>{c}</div>
              </Link>
            );
          })}
        </div>
      </Card>

      <SectionTitle
        right={
          <Link href="/app/proyectos" style={{ color: theme.accent, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Ver todos →
          </Link>
        }
      >
        Proyectos recientes
      </SectionTitle>

      {list.length === 0 ? (
        <EmptyState
          title="Aún no hay proyectos"
          description="Crea tu primer proyecto fotovoltaico para empezar a gestionarlo."
          action={
            <Link href="/app/proyectos" style={{ color: theme.accent, fontWeight: 600, textDecoration: "none" }}>
              Ir a Proyectos →
            </Link>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.slice(0, 6).map((p) => (
            <Link
              key={p.id}
              href={`/app/proyectos/${p.id}`}
              className="es-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 16px",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                textDecoration: "none",
                color: theme.text,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: 12.5, color: theme.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.direccion || p.cliente_nombre || "Sin dirección"}
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: theme.textMuted, whiteSpace: "nowrap" }}>{formatCLP(p.valor_neto)}</div>
              <EstadoBadge estado={p.estado} size="sm" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
