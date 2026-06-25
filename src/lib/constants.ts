import type { EstadoProyecto, TipoAdjunto, Role, MedioPago, EstadoTarea, EstadoEtapa, Prioridad } from "./types";

export const IVA = 0.19;

export const ESTADOS: { value: EstadoProyecto; label: string; color: string }[] = [
  { value: "cotizacion", label: "Cotización", color: "#a1a1aa" },
  { value: "aprobado", label: "Aprobado", color: "#3b82f6" },
  { value: "en_instalacion", label: "En instalación", color: "#f59e0b" },
  { value: "instalado", label: "Instalado", color: "#22c55e" },
  { value: "postventa", label: "Post-venta", color: "#14b8a6" },
  { value: "perdido", label: "Perdido", color: "#ef4444" },
];

export const ESTADO_MAP: Record<EstadoProyecto, { label: string; color: string }> =
  Object.fromEntries(ESTADOS.map((e) => [e.value, { label: e.label, color: e.color }])) as Record<
    EstadoProyecto,
    { label: string; color: string }
  >;

export const TIPOS_ADJUNTO: { value: TipoAdjunto; label: string }[] = [
  { value: "factura_equipo", label: "Factura equipo (garantía)" },
  { value: "boleta_venta", label: "Boleta / Factura de venta" },
  { value: "plano", label: "Plano de la casa" },
  { value: "boleta_luz", label: "Boleta de luz" },
  { value: "otro", label: "Otro documento" },
];

export const TIPO_ADJUNTO_MAP: Record<TipoAdjunto, string> = Object.fromEntries(
  TIPOS_ADJUNTO.map((t) => [t.value, t.label])
) as Record<TipoAdjunto, string>;

export const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "tecnico", label: "Técnico" },
  { value: "comercial", label: "Comercial" },
  { value: "pendiente", label: "Sin acceso (pendiente)" },
];

export const ROLE_MAP: Record<Role, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
) as Record<Role, string>;

// Formato moneda chilena: $1.234.567
export function formatCLP(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

export const STORAGE_ATTACHMENTS = "attachments";
export const STORAGE_DESIGNS = "designs";

// --- Finanzas ---

// A partir del total pagado, separa neto e IVA (crédito) hacia atrás.
export function desglosaIVA(total: number, tieneIva: boolean): { neto: number; iva: number; total: number } {
  const t = total || 0;
  const neto = tieneIva ? Math.round(t / (1 + IVA)) : t;
  return { neto, iva: t - neto, total: t };
}

export const IMPUTACION_LABEL: Record<"proyecto" | "sociedad" | "usuario", string> = {
  proyecto: "Proyecto",
  sociedad: "Sociedad (admin/operación)",
  usuario: "Usuario (personal)",
};

export const FONDO_LABEL: Record<"sociedad" | "usuario", string> = {
  sociedad: "Sociedad",
  usuario: "Usuario",
};

export const MEDIO_PAGO_OPTIONS: { value: MedioPago; label: string }[] = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "cheque", label: "Cheque" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "deposito", label: "Depósito" },
  { value: "otro", label: "Otro" },
];

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = Object.fromEntries(
  MEDIO_PAGO_OPTIONS.map((m) => [m.value, m.label])
) as Record<MedioPago, string>;

// --- Planificación ---

export const ESTADO_TAREA: { value: EstadoTarea; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "#a1a1aa" },
  { value: "en_progreso", label: "En curso", color: "#3b82f6" },
  { value: "hecha", label: "Hecha", color: "#22c55e" },
  { value: "bloqueada", label: "Bloqueada", color: "#ef4444" },
];
export const ESTADO_TAREA_MAP: Record<EstadoTarea, { label: string; color: string }> = Object.fromEntries(
  ESTADO_TAREA.map((e) => [e.value, { label: e.label, color: e.color }])
) as Record<EstadoTarea, { label: string; color: string }>;

export const ESTADO_ETAPA: { value: EstadoEtapa; label: string; color: string }[] = [
  { value: "pendiente", label: "Pendiente", color: "#a1a1aa" },
  { value: "en_progreso", label: "En curso", color: "#f59e0b" },
  { value: "completada", label: "Completada", color: "#22c55e" },
];
export const ESTADO_ETAPA_MAP: Record<EstadoEtapa, { label: string; color: string }> = Object.fromEntries(
  ESTADO_ETAPA.map((e) => [e.value, { label: e.label, color: e.color }])
) as Record<EstadoEtapa, { label: string; color: string }>;

export const PRIORIDADES: { value: Prioridad; label: string; color: string; orden: number }[] = [
  { value: "urgente", label: "Urgente", color: "#ef4444", orden: 0 },
  { value: "alta", label: "Alta", color: "#f59e0b", orden: 1 },
  { value: "normal", label: "Normal", color: "#a1a1aa", orden: 2 },
  { value: "baja", label: "Baja", color: "#6b7280", orden: 3 },
];
export const PRIORIDAD_MAP: Record<Prioridad, { label: string; color: string; orden: number }> = Object.fromEntries(
  PRIORIDADES.map((p) => [p.value, { label: p.label, color: p.color, orden: p.orden }])
) as Record<Prioridad, { label: string; color: string; orden: number }>;
