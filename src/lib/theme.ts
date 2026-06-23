// Tokens de diseño del backoffice (estética dark/solar, coherente con la landing v2).
// Es solo data => se puede importar tanto en server como client components.

export const theme = {
  bg: "#0a0b0d",
  bgElev: "#0f1115",
  surface: "rgba(255,255,255,0.035)",
  surfaceHover: "rgba(255,255,255,0.07)",
  surfaceSolid: "#14161b",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#f4f4f5",
  textMuted: "#9aa1ab",
  textFaint: "#646b76",
  accent: "#f59e0b",
  accent2: "#fb923c",
  accentSoft: "rgba(245,158,11,0.14)",
  accentGlow: "rgba(245,158,11,0.35)",
  danger: "#ef4444",
  ok: "#22c55e",
  radius: 14,
  radiusSm: 10,
} as const;

export const card: React.CSSProperties = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
  backdropFilter: "blur(12px)",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusSm,
  padding: "10px 12px",
  color: theme.text,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: theme.textMuted,
  marginBottom: 6,
  letterSpacing: 0.2,
};

export const btnPrimary: React.CSSProperties = {
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
  color: "#1a1206",
  border: "none",
  borderRadius: theme.radiusSm,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

export const btnGhost: React.CSSProperties = {
  background: theme.surface,
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusSm,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
