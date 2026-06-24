-- ============================================================
-- Era Solar — Módulo Ventas + Cuotas. Ejecutar después de 0002. Idempotente.
-- ============================================================

-- ---------- Cuotas (plan de pago del proyecto) ----------
create table if not exists public.cuotas (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  nombre            text not null default 'Cuota',
  monto             numeric not null default 0,
  fecha_vencimiento date,
  orden             int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_cuotas_project on public.cuotas(project_id);

-- ---------- Ventas ----------
create table if not exists public.sales (
  id                uuid primary key default gen_random_uuid(),
  proyecto_id       uuid references public.projects(id) on delete set null,
  monto_total       numeric not null default 0,   -- total recibido (IVA incluido si aplica)
  tiene_iva         boolean not null default true,
  medio_pago        text not null default 'transferencia'
                    check (medio_pago in ('transferencia','efectivo','cheque','tarjeta','deposito','otro')),
  fecha_pago        date,
  destino_tipo      text not null default 'sociedad' check (destino_tipo in ('sociedad','usuario')),
  destino_user_id   uuid references public.profiles(id) on delete set null,
  sociedad_id       uuid references public.sociedades(id) on delete set null,
  folio_factura     text,
  factura_path      text,                          -- PDF de la factura (bucket attachments, ventas/...)
  comprobante_path  text,                          -- comprobante de pago
  descripcion       text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_sales_proyecto on public.sales(proyecto_id);

-- ---------- Asignación venta → cuota(s), con monto (M:N, abonos parciales) ----------
create table if not exists public.sale_allocations (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales(id) on delete cascade,
  cuota_id   uuid not null references public.cuotas(id) on delete cascade,
  monto      numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (sale_id, cuota_id)
);
create index if not exists idx_alloc_sale  on public.sale_allocations(sale_id);
create index if not exists idx_alloc_cuota on public.sale_allocations(cuota_id);

-- updated_at
drop trigger if exists touch_cuotas on public.cuotas;
create trigger touch_cuotas before update on public.cuotas
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_sales on public.sales;
create trigger touch_sales before update on public.sales
  for each row execute function public.touch_updated_at();

-- ---------- RLS (miembros: acceso total) ----------
alter table public.cuotas           enable row level security;
alter table public.sales            enable row level security;
alter table public.sale_allocations enable row level security;

drop policy if exists "cuotas_member" on public.cuotas;
create policy "cuotas_member" on public.cuotas
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "sales_member" on public.sales;
create policy "sales_member" on public.sales
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "sale_allocations_member" on public.sale_allocations;
create policy "sale_allocations_member" on public.sale_allocations
  for all to authenticated using (public.is_member()) with check (public.is_member());
