# Era Solar — Backoffice (`/app`) · Guía de puesta en marcha

Backoffice para gestionar proyectos fotovoltaicos: usuarios con roles, proyectos
(con todos sus datos y adjuntos), **diseños** con editor de canvas (foto + escala +
paneles + dibujo), dashboard con métricas, pipeline de estados y export a PDF.

Stack: Next.js 16 + React 19 + Supabase (Auth Google, Postgres, Storage). Estilos inline,
todo en español. Login con Google restringido por whitelist de correos.

---

## 1. Crear las tablas en Supabase (1 sola vez)

1. Entra al **Dashboard de Supabase** del proyecto Era Solar
   (`https://supabase.com/dashboard/project/jifehlxswuwzlwgdcqqe`).
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Copia y pega **todo** el contenido de `supabase/migrations/0001_init.sql` y presiona **Run**.
   - Es idempotente: lo puedes correr de nuevo sin romper nada.
   - Crea tablas (`profiles`, `projects`, `designs`, `attachments`, `allowed_emails`),
     RLS, triggers, los buckets de Storage (`attachments` privado, `designs` público)
     y deja como **admin** a `hirarrazavala@gmail.com` y `matiasira007@gmail.com`.
4. Luego pega y corre también `supabase/migrations/0002_finanzas.sql` (módulo Finanzas:
   tablas `sociedades` y `purchases` con su RLS + una sociedad inicial editable).
5. Y por último `supabase/migrations/0003_ventas.sql` (Ventas + Cuotas: tablas `cuotas`,
   `sales` y `sale_allocations` con su RLS).
6. Y `supabase/migrations/0004_planificacion.sql` (Planificación: `project_stages`, `tasks`,
   `task_checklist_items` con su RLS).
7. Y `supabase/migrations/0005_plan_deps.sql` (dependencias de etapa, prioridad de tareas y
   tareas sin proyecto).
8. Y `supabase/migrations/0006_plan_template.sql` (plantilla de plan editable, tabla `plan_template`).

## 2. Activar el login con Google

**a) En Google Cloud Console** (https://console.cloud.google.com):
   1. Crea (o usa) un proyecto → **APIs & Services → Credentials**.
   2. **Create credentials → OAuth client ID → Web application**.
   3. En **Authorized redirect URIs** agrega exactamente:
      ```
      https://jifehlxswuwzlwgdcqqe.supabase.co/auth/v1/callback
      ```
   4. Guarda y copia el **Client ID** y el **Client secret**.
   5. Si pide configurar la *OAuth consent screen*, hazlo (External, agrega tu correo).

**b) En Supabase** → **Authentication → Providers → Google**:
   1. Actívalo (Enable) y pega el **Client ID** y **Client secret** del paso anterior.
   2. Guarda.

**c) En Supabase** → **Authentication → URL Configuration → Redirect URLs**, agrega:
   ```
   http://localhost:3002/auth/callback
   https://erasolar.cl/auth/callback        ← (tu dominio de producción)
   https://<lo-que-use-vercel>.vercel.app/auth/callback
   ```
   Y en **Site URL** pon tu dominio de producción (o `http://localhost:3002` para probar).

## 3. Probar

```bash
npm run dev -- -p 3002
```
- Abre http://localhost:3002/app → te manda a `/login`.
- "Continuar con Google" con `hirarrazavala@gmail.com` o `matiasira007@gmail.com` → entras como admin.
- Cualquier otro correo entra como "pendiente" (sin acceso) hasta que un admin lo autorice
  desde **Usuarios**.

## 4. Deploy (Vercel)

El proyecto ya está enlazado a Vercel (`era-solar`). Las env vars de Supabase
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) deben existir en Vercel.
Tras hacer deploy, agrega la redirect URL de producción en el paso 2c.

---

## Qué hay dentro

- **`/app`** — Dashboard: totales (proyectos, $ vendido neto/IVA, kWp, paneles) + pipeline + recientes.
- **`/app/proyectos`** — lista con buscador y filtros por estado; botón "Nuevo proyecto".
- **`/app/proyectos/[id]`** — ficha completa (cliente, dirección, valor con/sin IVA, paneles,
  modelo, inversor, descripción), cambio de estado, **diseños** y **documentos**
  (factura equipo/garantía, boleta venta, plano, boleta de luz…), y export **PDF**.
- **Editor de diseños** — subir foto (Google Earth), rotar, **calibrar escala** (dibuja un
  segmento y dices cuánto mide), agregar **paneles a escala real** (defines W×H en metros),
  **lápiz**, **línea recta**, **texto**, zoom/pan, deshacer/rehacer, exportar PNG y guardar.
  Cada proyecto puede tener varios diseños.
- **`/app/usuarios`** (solo admin) — invitar correos, asignar roles (admin / técnico / comercial),
  revocar acceso.

## Ideas para después
- Cálculo automático de generación mensual estimada (kWh) según paneles + radiación por comuna.
- Plantillas de paneles guardadas (modelos con sus medidas reales).
- Notas/timeline de actividad por proyecto.
- Generar cotización PDF para el cliente (no solo ficha interna).
- Recordatorios de mantención post-venta.
