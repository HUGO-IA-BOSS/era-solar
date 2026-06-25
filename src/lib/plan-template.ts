import type { Task, ProjectStage, EstadoTarea } from "./types";

// Plantilla estándar de un proyecto solar residencial en Chile (Net Billing / SEC).
// Se genera con el botón "Generar plan" y luego se edita libremente por proyecto.
// `bloqueadaPor` = nombre de la etapa que debe completarse antes (dependencia de etapa).
// `dependeDe` = título de la tarea que debe estar hecha antes (dependencia de tarea).

export type TplChecklist = { label: string; tipo: "check" | "foto" | "documento"; opcional?: boolean };
export type TplTask = {
  titulo: string;
  descripcion?: string;
  opcional?: boolean;
  estado?: EstadoTarea;
  dependeDe?: string;
  checklist?: TplChecklist[];
};
export type TplStage = { nombre: string; bloqueadaPor?: string; tasks: TplTask[] };

export const DEFAULT_PLAN: TplStage[] = [
  {
    nombre: "Visita técnica",
    tasks: [
      { titulo: "Agendar visita con el cliente" },
      {
        titulo: "Levantamiento en terreno",
        descripcion: "Tomar las fotos clave y las medidas de la instalación.",
        checklist: [
          { label: "Foto del techo", tipo: "foto" },
          { label: "Foto: dónde irá el inversor", tipo: "foto" },
          { label: "Foto: cómo se conecta el inversor al empalme", tipo: "foto" },
          { label: "Foto: dónde irá el tablero fotovoltaico", tipo: "foto" },
          { label: "Foto del tablero general", tipo: "foto" },
          { label: "Foto de la fachada de la casa", tipo: "foto" },
          { label: "Medidas del techo", tipo: "foto" },
          { label: "Medir una referencia y espacios importantes", tipo: "check" },
        ],
      },
      {
        titulo: "Reunir antecedentes iniciales",
        checklist: [
          { label: "Boleta de luz reciente", tipo: "documento" },
          { label: "Planos de la casa", tipo: "documento" },
        ],
      },
    ],
  },
  {
    nombre: "Diseño & cotización",
    bloqueadaPor: "Visita técnica",
    tasks: [
      { titulo: "Diseño de layout de paneles" },
      { titulo: "Dimensionar generación", dependeDe: "Diseño de layout de paneles" },
      { titulo: "Enviar cotización al cliente", dependeDe: "Dimensionar generación" },
      {
        titulo: "Aprobación / firma del cliente",
        dependeDe: "Enviar cotización al cliente",
        checklist: [{ label: "Cotización firmada", tipo: "documento" }],
      },
    ],
  },
  {
    nombre: "Trámite solicitud de conexión SEC",
    tasks: [
      {
        titulo: "Reunir antecedentes del cliente para SEC",
        descripcion: "Documentos necesarios para presentar la solicitud de conexión.",
        checklist: [
          { label: "Firma simple del cliente", tipo: "documento" },
          { label: "Foto carnet — frente", tipo: "foto" },
          { label: "Foto carnet — reverso", tipo: "foto" },
          { label: "Verificar que el cliente es titular de la cuenta de luz", tipo: "check" },
          { label: "TE1 (si lo tiene)", tipo: "documento", opcional: true },
        ],
      },
      { titulo: "Preparar y enviar solicitud a SEC", dependeDe: "Aprobación / firma del cliente" },
      {
        titulo: "Resolución SEC",
        descripcion: "Esperar respuesta. Si hay rechazo, crear tarea de subsanación y reenviar.",
        estado: "bloqueada",
        dependeDe: "Preparar y enviar solicitud a SEC",
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
    bloqueadaPor: "Compras & logística",
    tasks: [
      { titulo: "Montaje estructura" },
      { titulo: "Montaje paneles" },
      { titulo: "Montaje inversor" },
      { titulo: "Canalización DC" },
      { titulo: "Canalización AC y Tablero FV" },
      { titulo: "Señalética" },
      { titulo: "Puesta en marcha sin inyección" },
    ],
  },
  {
    nombre: "Netbilling",
    bloqueadaPor: "Instalación",
    tasks: [
      { titulo: "Trámite TE4" },
      { titulo: "Contrato firmado" },
      { titulo: "Solicitar cambio de medidor" },
    ],
  },
];

// ¿Está completa una etapa? (todas sus tareas no opcionales hechas)
export function stageCompleta(stageId: string | null, tasks: Task[]): boolean {
  if (!stageId) return true;
  const req = tasks.filter((t) => t.stage_id === stageId && !t.opcional);
  return req.every((t) => t.estado === "hecha");
}

// ¿Está bloqueada una tarea? Por su etapa prerequisito o por la tarea de la que depende.
export function tareaBloqueada(
  t: Task,
  tasks: Task[],
  stages: ProjectStage[]
): { tipo: "etapa" | "tarea"; label: string } | null {
  const stage = stages.find((s) => s.id === t.stage_id);
  if (stage?.depends_on_stage_id && !stageCompleta(stage.depends_on_stage_id, tasks)) {
    const pre = stages.find((s) => s.id === stage.depends_on_stage_id);
    return { tipo: "etapa", label: pre?.nombre ?? "etapa previa" };
  }
  if (t.depends_on_task_id) {
    const dep = tasks.find((x) => x.id === t.depends_on_task_id);
    if (dep && dep.estado !== "hecha") return { tipo: "tarea", label: dep.titulo };
  }
  return null;
}

// La próxima tarea que destraba el proyecto: pendiente/en curso, no opcional, no bloqueada,
// ordenada por (etapa → orden → fecha límite).
export function proximaAccion(tasks: Task[], stages: ProjectStage[]): Task | null {
  const stageOrden = new Map(stages.map((s) => [s.id, s.orden]));
  const candidatos = tasks.filter(
    (t) =>
      (t.estado === "pendiente" || t.estado === "en_progreso") &&
      !t.opcional &&
      !tareaBloqueada(t, tasks, stages)
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
