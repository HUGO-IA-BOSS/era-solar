-- ============================================================
-- Era Solar — Módulo Finanzas: Sociedades + Compras.
-- Ejecutar en Supabase SQL Editor (después de 0001). Idempotente.
-- ============================================================

-- ---------- Sociedades (empresas) ----------
create table if not exists public.sociedades (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  rut        text,
  created_at timestamptz not null default now()
);

-- ---------- Compras ----------
create table if not exists public.purchases (
  id                 uuid primary key default gen_random_uuid(),
  fecha_compra       date,
  proveedor          text,
  rut_proveedor      text,
  monto_total        numeric not null default 0,   -- total pagado (IVA incluido si aplica)
  tiene_iva          boolean not null default true,
  con_factura        boolean not null default true,
  factura_a_sociedad boolean not null default true,
  folio_factura      text,
  -- imputación: a qué se carga el gasto
  imputacion_tipo    text not null default 'sociedad'
                     check (imputacion_tipo in ('proyecto','sociedad','usuario')),
  proyecto_id        uuid references public.projects(id) on delete set null,
  uso_user_id        uuid references public.profiles(id) on delete set null,
  -- fondos: quién pagó
  fondo_tipo         text not null default 'sociedad' check (fondo_tipo in ('sociedad','usuario')),
  fondo_user_id      uuid references public.profiles(id) on delete set null,
  sociedad_id        uuid references public.sociedades(id) on delete set null,
  fecha_pago         date,
  descripcion        text,
  foto_path          text,                          -- ruta en el bucket 'attachments' (compras/...)
  created_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_purchases_proyecto on public.purchases(proyecto_id);
create index if not exists idx_purchases_fecha    on public.purchases(fecha_compra);

drop trigger if exists touch_purchases on public.purchases;
create trigger touch_purchases before update on public.purchases
  for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.sociedades enable row level security;
alter table public.purchases  enable row level security;

-- Sociedades: miembros leen, solo admin escribe.
drop policy if exists "sociedades_select" on public.sociedades;
create policy "sociedades_select" on public.sociedades
  for select to authenticated using (public.is_member());
drop policy if exists "sociedades_insert" on public.sociedades;
create policy "sociedades_insert" on public.sociedades
  for insert to authenticated with check (public.is_admin());
drop policy if exists "sociedades_update" on public.sociedades;
create policy "sociedades_update" on public.sociedades
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "sociedades_delete" on public.sociedades;
create policy "sociedades_delete" on public.sociedades
  for delete to authenticated using (public.is_admin());

-- Compras: acceso total para miembros.
drop policy if exists "purchases_member" on public.purchases;
create policy "purchases_member" on public.purchases
  for all to authenticated using (public.is_member()) with check (public.is_member());

-- ---------- Seed: una sociedad inicial (editable en /app/sociedades) ----------
insert into public.sociedades (nombre, rut)
select 'Era Solar', null
where not exists (select 1 from public.sociedades);
