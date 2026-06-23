import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EstadoBadge, EmptyState } from "../_components/ui";
import { formatCLP } from "@/lib/constants";
import { theme } from "@/lib/theme";
import type { Project } from "@/lib/types";
import NewProjectButton from "./_components/NewProjectButton";
import ProjectsToolbar from "./_components/ProjectsToolbar";

export const dynamic = "force-dynamic";

export default async function ProyectosPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const estado = sp.estado;
  const q = sp.q?.replace(/[%,()]/g, "").trim();

  const supabase = await createClient();
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);
  if (q) query = query.or(`nombre.ilike.%${q}%,direccion.ilike.%${q}%,cliente_nombre.ilike.%${q}%`);

  const { data } = await query;
  const list = (data ?? []) as Project[];

  return (
    <div>
      <PageHeader
        title="Proyectos"
        subtitle="Gestiona tus proyectos fotovoltaicos"
        actions={<NewProjectButton />}
      />

      <Suspense fallback={null}>
        <ProjectsToolbar />
      </Suspense>

      {list.length === 0 ? (
        <EmptyState
          title={estado || q ? "Sin resultados" : "Aún no hay proyectos"}
          description={
            estado || q
              ? "Prueba quitando los filtros de búsqueda."
              : "Crea tu primer proyecto con el botón “Nuevo proyecto”."
          }
        />
      ) : (
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
              gap: 12,
              padding: "11px 18px",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              color: theme.textFaint,
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bgElev,
            }}
            className="es-table-head"
          >
            <div>Proyecto</div>
            <div>Paneles</div>
            <div>Valor neto</div>
            <div>Estado</div>
          </div>
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/app/proyectos/${p.id}`}
              className="es-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
                gap: 12,
                alignItems: "center",
                padding: "14px 18px",
                textDecoration: "none",
                color: theme.text,
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: 12.5, color: theme.textFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.direccion || p.cliente_nombre || "—"}
                </div>
              </div>
              <div style={{ fontSize: 14, color: theme.textMuted }}>{p.cantidad_paneles ?? "—"}</div>
              <div style={{ fontSize: 14, color: theme.textMuted }}>{formatCLP(p.valor_neto)}</div>
              <div>
                <EstadoBadge estado={p.estado} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
