-- ============================================================
-- Era Solar — Planificación: Etapas + Tareas + Checklist. Ejecutar tras 0003. Idempotente.
-- ============================================================

create table if not exists public.project_stages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  nombre       text not null,
  orden        int not null default 0,
  estado       text not null default 'pendiente' check (estado in ('pendiente','en_progreso','completada')),
  fecha_inicio date,
  fecha_fin    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_stages_project on public.project_stages(project_id);

create table if not exists public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.projects(id) on delete cascade,
  stage_id           uuid references public.project_stages(id) on delete set null,
  titulo             text not null,
  descripcion        text,
  estado             text not null default 'pendiente' check (estado in ('pendiente','en_progreso','hecha','bloqueada')),
  responsable_id     uuid references public.profiles(id) on delete set null,
  fecha_inicio       date,
  fecha_limite       date,
  orden              int not null default 0,
  opcional           boolean not null default false,
  bloqueo_motivo     text,
  depends_on_task_id uuid references public.tasks(id) on delete set null,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_tasks_stage   on public.tasks(stage_id);

create table if not exists public.task_checklist_items (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  label         text not null,
  tipo          text not null default 'check' check (tipo in ('check','foto','documento')),
  done          boolean not null default false,
  opcional      boolean not null default false,
  storage_path  text,
  nombre_archivo text,
  orden         int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_checklist_task on public.task_checklist_items(task_id);

-- updated_at
drop trigger if exists touch_stages on public.project_stages;
create trigger touch_stages before update on public.project_stages
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_tasks on public.tasks;
create trigger touch_tasks before update on public.tasks
  for each row execute function public.touch_updated_at();

-- RLS (miembros: acceso total)
alter table public.project_stages       enable row level security;
alter table public.tasks                enable row level security;
alter table public.task_checklist_items enable row level security;

drop policy if exists "stages_member" on public.project_stages;
create policy "stages_member" on public.project_stages
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "tasks_member" on public.tasks;
create policy "tasks_member" on public.tasks
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "checklist_member" on public.task_checklist_items;
create policy "checklist_member" on public.task_checklist_items
  for all to authenticated using (public.is_member()) with check (public.is_member());
