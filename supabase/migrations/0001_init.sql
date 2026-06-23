-- ============================================================
-- Era Solar — Backoffice. Migración inicial.
-- Ejecutar UNA vez en: Supabase Dashboard → SQL Editor → New query → Run.
-- Es idempotente: se puede volver a correr sin romper nada.
-- ============================================================

-- ---------- 1. Whitelist de correos autorizados ----------
create table if not exists public.allowed_emails (
  email      text primary key,
  role       text not null default 'tecnico'
             check (role in ('admin','tecnico','comercial')),
  created_at timestamptz not null default now()
);

-- ---------- 2. Perfiles (1:1 con auth.users) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  avatar_url text,
  role       text not null default 'pendiente'
             check (role in ('admin','tecnico','comercial','pendiente')),
  created_at timestamptz not null default now()
);

-- ---------- 3. Proyectos ----------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  direccion        text,
  descripcion      text,
  estado           text not null default 'cotizacion'
                   check (estado in ('cotizacion','aprobado','en_instalacion','instalado','postventa','perdido')),
  cliente_nombre   text,
  cliente_email    text,
  cliente_telefono text,
  valor_neto       numeric,            -- CLP sin IVA; el valor con IVA se deriva (×1.19)
  cantidad_paneles int,
  modelo_panel     text,
  potencia_panel_w int,
  modelo_inversor  text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------- 4. Diseños (varios por proyecto) ----------
create table if not exists public.designs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  nombre        text not null default 'Diseño',
  scene         jsonb,
  thumbnail_url text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- 5. Adjuntos (facturas, planos, boletas) ----------
create table if not exists public.attachments (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  tipo         text not null default 'otro'
               check (tipo in ('factura_equipo','boleta_venta','plano','boleta_luz','otro')),
  nombre       text not null,
  storage_path text not null,
  mime_type    text,
  size         bigint,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_designs_project     on public.designs(project_id);
create index if not exists idx_attachments_project on public.attachments(project_id);
create index if not exists idx_projects_estado     on public.projects(estado);

-- ============================================================
-- Funciones helper (SECURITY DEFINER => evitan recursión de RLS)
-- ============================================================
create or replace function public.is_member()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','tecnico','comercial')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Trigger: crear perfil automáticamente al registrarse (Google).
-- El rol sale de la whitelist; si no está, queda 'pendiente' (sin acceso).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_role text;
begin
  select role into v_role from public.allowed_emails where lower(email) = lower(new.email);
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(v_role, 'pendiente')
  )
  on conflict (id) do update set
    email      = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard: solo un admin puede cambiar el rol de un perfil (evita auto-escalada).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar el rol';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_profile_role_trg on public.profiles;
create trigger guard_profile_role_trg before update on public.profiles
  for each row execute function public.guard_profile_role();

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists touch_projects on public.projects;
create trigger touch_projects before update on public.projects
  for each row execute function public.touch_updated_at();
drop trigger if exists touch_designs on public.designs;
create trigger touch_designs before update on public.designs
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.projects      enable row level security;
alter table public.designs       enable row level security;
alter table public.attachments   enable row level security;

-- profiles: todos los autenticados ven el equipo; edición propia o admin.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- allowed_emails: solo admin.
drop policy if exists "allowed_emails_admin" on public.allowed_emails;
create policy "allowed_emails_admin" on public.allowed_emails
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects / designs / attachments: acceso total para miembros con rol válido.
drop policy if exists "projects_member" on public.projects;
create policy "projects_member" on public.projects
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "designs_member" on public.designs;
create policy "designs_member" on public.designs
  for all to authenticated using (public.is_member()) with check (public.is_member());

drop policy if exists "attachments_member" on public.attachments;
create policy "attachments_member" on public.attachments
  for all to authenticated using (public.is_member()) with check (public.is_member());

-- ============================================================
-- Storage: buckets + políticas
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('attachments','attachments', false),
  ('designs','designs', true)
on conflict (id) do nothing;

-- attachments: privado, solo miembros (acceso vía signed URLs).
drop policy if exists "attachments_member_all" on storage.objects;
create policy "attachments_member_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'attachments' and public.is_member())
  with check (bucket_id = 'attachments' and public.is_member());

-- designs: lectura pública (para exportar el canvas sin "tainted canvas"); escritura miembros.
drop policy if exists "designs_read_public" on storage.objects;
create policy "designs_read_public" on storage.objects
  for select to public using (bucket_id = 'designs');

drop policy if exists "designs_insert_member" on storage.objects;
create policy "designs_insert_member" on storage.objects
  for insert to authenticated with check (bucket_id = 'designs' and public.is_member());

drop policy if exists "designs_update_member" on storage.objects;
create policy "designs_update_member" on storage.objects
  for update to authenticated using (bucket_id = 'designs' and public.is_member());

drop policy if exists "designs_delete_member" on storage.objects;
create policy "designs_delete_member" on storage.objects
  for delete to authenticated using (bucket_id = 'designs' and public.is_member());

-- ============================================================
-- Seed: los dos administradores iniciales
-- ============================================================
insert into public.allowed_emails (email, role) values
  ('hirarrazavala@gmail.com','admin'),
  ('matiasira007@gmail.com','admin')
on conflict (email) do update set role = excluded.role;

-- Si ya habían entrado antes de ser whitelisteados, promoverlos.
update public.profiles p set role = ae.role
from public.allowed_emails ae
where lower(p.email) = lower(ae.email) and p.role = 'pendiente';
