import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, SectionTitle, Field, EstadoBadge } from "../../_components/ui";
import { formatCLP, IVA } from "@/lib/constants";
import { theme, btnPrimary } from "@/lib/theme";
import { proximaAccion } from "@/lib/plan-template";
import type { Project, Design, Attachment, Cuota, SaleAllocation, ProjectStage, Task } from "@/lib/types";
import EstadoSelector from "./_components/EstadoSelector";
import DesignsSection from "./_components/DesignsSection";
import AttachmentsManager from "./_components/AttachmentsManager";
import ProjectHeaderActions from "./_components/ProjectHeaderActions";
import CuotasSection from "./_components/CuotasSection";

export const dynamic = "force-dynamic";

export default async function ProyectoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single<Project>();
  if (!project) notFound();

  const [{ data: designsData }, { data: attachmentsData }, { data: cuotasData }, { data: usersData }, { data: sociedadesData }] =
    await Promise.all([
      supabase.from("designs").select("*").eq("project_id", id).order("updated_at", { ascending: false }),
      supabase.from("attachments").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("cuotas").select("*").eq("project_id", id).order("orden"),
      supabase.from("profiles").select("id, full_name, email").neq("role", "pendiente").order("full_name"),
      supabase.from("sociedades").select("id").limit(1),
    ]);

  const [{ data: stagesData }, { data: tasksData }] = await Promise.all([
    supabase.from("project_stages").select("*").eq("project_id", id).order("orden"),
    supabase.from("tasks").select("*").eq("project_id", id).order("orden"),
  ]);
  const stages = (stagesData ?? []) as ProjectStage[];
  const tasks = (tasksData ?? []) as Task[];
  const proxima = proximaAccion(tasks, stages);

  const designs = (designsData ?? []) as Design[];
  const attachments = (attachmentsData ?? []) as Attachment[];
  const cuotas = (cuotasData ?? []) as Cuota[];
  const designThumbUrl = designs.find((d) => d.thumbnail_url)?.thumbnail_url ?? null;

  // Abonos de las cuotas de este proyecto (para estado pendiente/parcial/pagada).
  const cuotaIds = cuotas.map((c) => c.id);
  const { data: allocData } = cuotaIds.length
    ? await supabase.from("sale_allocations").select("*").in("cuota_id", cuotaIds)
    : { data: [] as SaleAllocation[] };
  const allocations = (allocData ?? []) as SaleAllocation[];

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

          {/* Plan del proyecto */}
          <Card>
            <SectionTitle
              right={
                stages.length > 0 ? (
                  <Link href={`/app/proyectos/${id}/plan`} style={{ color: theme.accent, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                    Abrir plan →
                  </Link>
                ) : undefined
              }
            >
              Plan del proyecto
            </SectionTitle>
            {stages.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ color: theme.textMuted, fontSize: 14 }}>Aún no hay plan.</span>
                <Link href={`/app/proyectos/${id}/plan`} className="es-btn" style={{ ...btnPrimary, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Sparkles size={16} /> Crear plan
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: theme.accentSoft, border: "1px solid rgba(245,158,11,0.35)", borderRadius: 10, padding: "10px 14px" }}>
                  <ListChecks size={16} color={theme.accent} />
                  {proxima ? (
                    <span style={{ fontSize: 14 }}>
                      <span style={{ color: theme.textMuted }}>Próxima acción: </span>
                      <strong>{proxima.titulo}</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: 14, color: theme.ok }}>✓ Sin tareas pendientes</span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
                  {stages.map((s) => {
                    const req = tasks.filter((t) => t.stage_id === s.id && !t.opcional);
                    const done = req.filter((t) => t.estado === "hecha").length;
                    const pct = req.length ? (done / req.length) * 100 : 0;
                    return (
                      <div key={s.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "9px 11px" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nombre}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? theme.ok : theme.accent }} />
                          </div>
                          <span style={{ fontSize: 11, color: theme.textFaint }}>{done}/{req.length}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
            <SectionTitle>Cuotas / Plan de pago</SectionTitle>
            <CuotasSection
              projectId={id}
              projectNombre={project.nombre}
              valorNeto={project.valor_neto}
              cuotas={cuotas}
              allocations={allocations}
              users={usersData ?? []}
              sociedadId={sociedadesData?.[0]?.id ?? null}
            />
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
