-- ============================================================
-- Era Solar — Planificación v2: dependencias de etapa, prioridad y tareas sin proyecto.
-- Ejecutar tras 0004. Idempotente.
-- ============================================================

-- Una etapa puede estar bloqueada hasta que se complete otra etapa.
alter table public.project_stages
  add column if not exists depends_on_stage_id uuid references public.project_stages(id) on delete set null;

-- Prioridad de la tarea (para la bandeja global).
alter table public.tasks
  add column if not exists prioridad text not null default 'normal'
  check (prioridad in ('baja','normal','alta','urgente'));

-- Tareas que no pertenecen a un proyecto (todos generales).
alter table public.tasks alter column project_id drop not null;
