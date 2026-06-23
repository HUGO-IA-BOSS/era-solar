import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle, Field, EstadoBadge } from "../../_components/ui";
import { formatCLP, IVA } from "@/lib/constants";
import { theme } from "@/lib/theme";
import type { Project, Design, Attachment } from "@/lib/types";
import EstadoSelector from "./_components/EstadoSelector";
import DesignsSection from "./_components/DesignsSection";
import AttachmentsManager from "./_components/AttachmentsManager";
import ProjectHeaderActions from "./_components/ProjectHeaderActions";

export const dynamic = "force-dynamic";

export default async function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single<Project>();
  if (!project) notFound();

  const [{ data: designsData }, { data: attachmentsData }] = await Promise.all([
    supabase.from("designs").select("*").eq("project_id", id).order("updated_at", { ascending: false }),
    supabase.from("attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
  ]);

  const designs = (designsData ?? []) as Design[];
  const attachments = (attachmentsData ?? []) as Attachment[];
  const designThumbUrl = designs.find((d) => d.thumbnail_url)?.thumbnail_url ?? null;

  const neto = project.valor_neto;
  const conIva = neto != null ? Math.round(neto * (1 + IVA)) : null;
  const kwp =
    project.cantidad_paneles && project.potencia_panel_w
      ? (project.cantidad_paneles * project.potencia_panel_w) / 1000
      : null;

  return (
    <div>
      <Link
        href="/app/proyectos"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.textMuted, fontSize: 13, textDecoration: "none", marginBottom: 14 }}
      >
        <ArrowLeft size={15} /> Proyectos
      </Link>

      <PageHeader
        title={project.nombre}
        subtitle={project.direccion ?? undefined}
        actions={<ProjectHeaderActions project={project} designThumbUrl={designThumbUrl} />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 18, alignItems: "start" }} className="es-detail-grid">
        {/* Columna principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <Card>
            <SectionTitle right={<EstadoBadge estado={project.estado} />}>Información</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 18 }}>
              <Field label="Cliente" value={project.cliente_nombre} />
              <Field label="Teléfono" value={project.cliente_telefono} />
              <Field label="Email" value={project.cliente_email} />
              <Field label="Dirección" value={project.direccion} />
              <Field label="Cantidad de paneles" value={project.cantidad_paneles} />
              <Field label="Modelo de panel" value={project.modelo_panel} />
              <Field label="Potencia por panel" value={project.potencia_panel_w ? `${project.potencia_panel_w} W` : null} />
              <Field label="Potencia total" value={kwp != null ? `${kwp.toLocaleString("es-CL", { maximumFractionDigits: 2 })} kWp` : null} />
              <Field label="Inversor" value={project.modelo_inversor} />
            </div>
            {project.descripcion && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${theme.border}` }}>
                <Field label="Descripción" value={<span style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{project.descripcion}</span>} />
              </div>
            )}
          </Card>

          {/* Valores */}
          <Card>
            <SectionTitle>Valor</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              <Field label="Neto (sin IVA)" value={formatCLP(neto)} />
              <Field label="IVA (19%)" value={conIva != null ? formatCLP(conIva - neto!) : "—"} />
              <Field label="Total (con IVA)" value={<strong style={{ color: theme.accent }}>{formatCLP(conIva)}</strong>} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Diseños</SectionTitle>
            <DesignsSection projectId={id} designs={designs} />
          </Card>

          <Card>
            <SectionTitle>Documentos</SectionTitle>
            <AttachmentsManager projectId={id} attachments={attachments} />
          </Card>
        </div>

        {/* Columna lateral: estado */}
        <Card style={{ position: "sticky", top: 18 }}>
          <SectionTitle>Estado del proyecto</SectionTitle>
          <EstadoSelector id={id} current={project.estado} />
        </Card>
      </div>
    </div>
  );
}
