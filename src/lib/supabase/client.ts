import { createBrowserClient } from "@supabase/ssr";

// Sesión de 30 días (se renueva sola en cada visita).
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// Cliente de Supabase para client components ('use client').
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: SESSION_MAX_AGE } }
  );
}
