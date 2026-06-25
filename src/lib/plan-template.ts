import type { Task, ProjectStage, EstadoTarea, TipoChecklist } from "./types";

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
    bloqueadaPor: "Diseño & cotización", // toda la etapa espera la aprobación/firma del cliente
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
      { titulo: "Preparar y enviar solicitud a SEC" },
      {
        titulo: "Resolución SEC",
        descripcion: "Esperar respuesta. Si hay rechazo, crear tarea de subsanación y reenviar.",
        dependeDe: "Preparar y enviar solicitud a SEC",
      },
    ],
  },
  {
    nombre: "Compras & logística",
    bloqueadaPor: "Trámite solicitud de conexión SEC", // espera la Resolución SEC
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

// ============================================================
// Plantilla EDITABLE (guardada en BD como JSON). Usa claves estables para que
// renombrar no rompa dependencias. Las dependencias referencian por `key`.
// ============================================================

export type StoredChecklist = { label: string; tipo: TipoChecklist; opcional?: boolean };
export type StoredTask = {
  key: string;
  titulo: string;
  descripcion?: string;
  opcional?: boolean;
  estado?: EstadoTarea;
  dependsOnTaskKey?: string | null;
  checklist: StoredChecklist[];
};
export type StoredStage = {
  key: string;
  nombre: string;
  dependsOnStageKey?: string | null;
  tasks: StoredTask[];
};

// Convierte la plantilla por defecto (referencias por nombre/título) a la forma
// con claves estables que usa el editor y la BD.
export function defaultStoredTemplate(): StoredStage[] {
  const stageKeyByName = new Map<string, string>();
  const taskKeyByTitulo = new Map<string, string>();
  DEFAULT_PLAN.forEach((s, i) => {
    stageKeyByName.set(s.nombre, `e${i}`);
    s.tasks.forEach((t, j) => taskKeyByTitulo.set(t.titulo, `e${i}t${j}`));
  });
  return DEFAULT_PLAN.map((s, i) => ({
    key: `e${i}`,
    nombre: s.nombre,
    dependsOnStageKey: s.bloqueadaPor ? stageKeyByName.get(s.bloqueadaPor) ?? null : null,
    tasks: s.tasks.map((t, j) => ({
      key: `e${i}t${j}`,
      titulo: t.titulo,
      descripcion: t.descripcion,
      opcional: t.opcional,
      estado: t.estado,
      dependsOnTaskKey: t.dependeDe ? taskKeyByTitulo.get(t.dependeDe) ?? null : null,
      checklist: (t.checklist ?? []).map((c) => ({ label: c.label, tipo: c.tipo, opcional: c.opcional })),
    })),
  }));
}

// Valida la plantilla antes de guardar. Devuelve lista de errores (vacía = ok).
export function validateTemplate(stages: StoredStage[]): string[] {
  const errors: string[] = [];
  if (!stages.length) errors.push("Debe haber al menos una etapa.");

  const stageKeys = new Set(stages.map((s) => s.key));
  const allTasks = stages.flatMap((s) => s.tasks);
  const taskKeys = new Set(allTasks.map((t) => t.key));
  const taskTitulo = new Map(allTasks.map((t) => [t.key, t.titulo || "(sin título)"]));

  for (const s of stages) {
    if (!s.nombre.trim()) errors.push("Hay una etapa sin nombre.");
    if (s.dependsOnStageKey) {
      if (s.dependsOnStageKey === s.key) errors.push(`La etapa "${s.nombre}" no puede depender de sí misma.`);
      else if (!stageKeys.has(s.dependsOnStageKey)) errors.push(`La etapa "${s.nombre}" depende de una etapa que ya no existe.`);
    }
    for (const t of s.tasks) {
      if (!t.titulo.trim()) errors.push(`En "${s.nombre || "una etapa"}" hay una tarea sin título.`);
      if (t.dependsOnTaskKey) {
        if (t.dependsOnTaskKey === t.key) errors.push(`La tarea "${t.titulo}" no puede depender de sí misma.`);
        else if (!taskKeys.has(t.dependsOnTaskKey)) errors.push(`La tarea "${t.titulo}" depende de una tarea que ya no existe.`);
      }
      for (const c of t.checklist) {
        if (!c.label.trim()) errors.push(`En "${t.titulo || "una tarea"}" hay un ítem de checklist sin texto.`);
      }
    }
  }

  // Ciclos de dependencia (cada nodo tiene a lo más una dependencia => seguir la cadena).
  const stageDep = new Map(stages.map((s) => [s.key, s.dependsOnStageKey ?? null]));
  const taskDep = new Map(allTasks.map((t) => [t.key, t.dependsOnTaskKey ?? null]));
  const findCycle = (keys: string[], dep: Map<string, string | null>): string | null => {
    for (const k of keys) {
      const seen = new Set<string>([k]);
      let cur = dep.get(k) ?? null;
      while (cur) {
        if (seen.has(cur)) return k;
        seen.add(cur);
        cur = dep.get(cur) ?? null;
      }
    }
    return null;
  };
  const sc = findCycle([...stageKeys], stageDep);
  if (sc) errors.push(`Hay un ciclo en las dependencias de etapas (revisa "${stages.find((s) => s.key === sc)?.nombre}").`);
  const tc = findCycle([...taskKeys], taskDep);
  if (tc) errors.push(`Hay un ciclo en las dependencias de tareas (revisa "${taskTitulo.get(tc)}").`);

  return errors;
}
