"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setError("No se pudo iniciar sesión. Intenta de nuevo.");
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: theme.bg,
        color: theme.text,
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: 24,
      }}
    >
      {/* Aurora de fondo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(245,158,11,0.18), transparent 60%)," +
            "radial-gradient(50% 50% at 90% 90%, rgba(251,146,60,0.12), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 20,
          backdropFilter: "blur(16px)",
          padding: "40px 34px",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 20px",
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
            color: "#1a1206",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: -1,
          }}
        >
          ES
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>Era Solar</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, margin: "0 0 30px" }}>
          Backoffice de proyectos fotovoltaicos
        </p>

        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "#fff",
            color: "#1f1f1f",
            border: "none",
            borderRadius: 12,
            padding: "14px 18px",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "inherit",
          }}
        >
          <GoogleIcon />
          {loading ? "Conectando…" : "Continuar con Google"}
        </button>

        <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 22, lineHeight: 1.5 }}>
          Acceso restringido al equipo de Era Solar. Si tu correo no está autorizado,
          contacta a un administrador.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
