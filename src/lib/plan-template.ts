import type { Task, EstadoTarea } from "./types";

// Plantilla estándar de un proyecto solar residencial en Chile (Net Billing / SEC).
// Se genera con el botón "Generar plan" y luego se edita libremente por proyecto.

export type TplChecklist = { label: string; tipo: "check" | "foto" | "documento"; opcional?: boolean };
export type TplTask = {
  titulo: string;
  descripcion?: string;
  opcional?: boolean;
  estado?: EstadoTarea;
  checklist?: TplChecklist[];
};
export type TplStage = { nombre: string; tasks: TplTask[] };

export const DEFAULT_PLAN: TplStage[] = [
  {
    nombre: "Visita técnica",
    tasks: [
      { titulo: "Agendar visita con el cliente" },
      {
        titulo: "Levantamiento en terreno",
        descripcion: "Tomar las fotos clave de la instalación.",
        checklist: [
          { label: "Foto del techo", tipo: "foto" },
          { label: "Foto: dónde irá el inversor", tipo: "foto" },
          { label: "Foto: cómo se conecta el inversor al empalme", tipo: "foto" },
          { label: "Foto: dónde irá el tablero fotovoltaico", tipo: "foto" },
          { label: "Foto del tablero general", tipo: "foto" },
          { label: "Foto de la fachada de la casa", tipo: "foto" },
          { label: "Medidas del techo", tipo: "foto" },
        ],
      },
      {
        titulo: "Reunir antecedentes iniciales",
        checklist: [{ label: "Boleta de luz reciente", tipo: "documento" }],
      },
    ],
  },
  {
    nombre: "Diseño & cotización",
    tasks: [
      { titulo: "Diseño de layout de paneles" },
      { titulo: "Dimensionar generación" },
      { titulo: "Enviar cotización al cliente" },
      {
        titulo: "Aprobación / firma del cliente",
        checklist: [{ label: "Cotización firmada", tipo: "documento" }],
      },
    ],
  },
  {
    nombre: "Trámite solicitud de conexión SEC (Net Billing)",
    tasks: [
      {
        titulo: "Reunir antecedentes del cliente para SEC",
        descripcion: "Documentos necesarios para presentar la solicitud de conexión.",
        checklist: [
          { label: "Firma simple del cliente", tipo: "documento" },
          { label: "Foto carnet — frente", tipo: "foto" },
          { label: "Foto carnet — reverso", tipo: "foto" },
          { label: "Verificar que el cliente es titular de la cuenta de luz", tipo: "check" },
          { label: "Planos de la casa", tipo: "documento", opcional: true },
          { label: "TE1 (si lo tiene)", tipo: "documento", opcional: true },
        ],
      },
      { titulo: "Preparar y enviar solicitud a SEC" },
      {
        titulo: "Resolución SEC",
        descripcion: "Esperar respuesta. Si hay rechazo, crear tarea de subsanación y reenviar.",
        estado: "bloqueada",
      },
    ],
  },
  {
    nombre: "Compras & logística",
    tasks: [
      { titulo: "Comprar equipos (paneles, inversor, etc.)" },
      { titulo: "Coordinar fecha de instalación" },
    ],
  },
  {
    nombre: "Instalación",
    tasks: [
      { titulo: "Montaje de estructura y paneles" },
      { titulo: "Instalación de inversor y tableros" },
      { titulo: "Conexión a empalme" },
    ],
  },
  {
    nombre: "Puesta en marcha & cierre",
    tasks: [
      { titulo: "Pruebas / energización" },
      { titulo: "Inspección" },
      { titulo: "Entrega y capacitación al cliente" },
      { titulo: "Activación Net Billing" },
    ],
  },
  {
    nombre: "Post-venta",
    tasks: [{ titulo: "Mantención programada", opcional: true }],
  },
];

// La próxima tarea que destraba el proyecto: pendiente/en curso, no opcional, con su
// dependencia satisfecha, ordenada por (etapa → orden → fecha límite).
export function proximaAccion(tasks: Task[], stages: { id: string; orden: number }[]): Task | null {
  const stageOrden = new Map(stages.map((s) => [s.id, s.orden]));
  const doneIds = new Set(tasks.filter((t) => t.estado === "hecha").map((t) => t.id));
  const candidatos = tasks.filter(
    (t) =>
      (t.estado === "pendiente" || t.estado === "en_progreso") &&
      !t.opcional &&
      (!t.depends_on_task_id || doneIds.has(t.depends_on_task_id))
  );
  candidatos.sort((a, b) => {
    const sa = stageOrden.get(a.stage_id ?? "") ?? 999;
    const sb = stageOrden.get(b.stage_id ?? "") ?? 999;
    if (sa !== sb) return sa - sb;
    if (a.orden !== b.orden) return a.orden - b.orden;
    return (a.fecha_limite ?? "9999-12-31").localeCompare(b.fecha_limite ?? "9999-12-31");
  });
  return candidatos[0] ?? null;
}
