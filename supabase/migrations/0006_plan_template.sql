-- ============================================================
-- Era Solar — Plantilla de plan editable (singleton JSON). Ejecutar tras 0005. Idempotente.
-- ============================================================

create table if not exists public.plan_template (
  id         int primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint plan_template_singleton check (id = 1)
);

alter table public.plan_template enable row level security;

drop policy if exists "plan_template_select" on public.plan_template;
create policy "plan_template_select" on public.plan_template
  for select to authenticated using (public.is_member());

drop policy if exists "plan_template_admin" on public.plan_template;
create policy "plan_template_admin" on public.plan_template
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
