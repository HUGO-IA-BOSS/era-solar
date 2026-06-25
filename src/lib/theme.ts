// Tokens de diseño del backoffice — modo claro.
// Es solo data => se puede importar tanto en server como client components.

export const theme = {
  bg: "#f3f4f6",
  bgElev: "#ffffff",
  surface: "#ffffff",
  surfaceHover: "rgba(0,0,0,0.04)",
  surfaceSolid: "#ffffff",
  border: "rgba(0,0,0,0.12)",
  borderStrong: "rgba(0,0,0,0.22)",
  text: "#15181d",
  textMuted: "#5b626c",
  textFaint: "#98a0ab",
  accent: "#f59e0b",
  accent2: "#fb923c",
  accentSoft: "rgba(245,158,11,0.15)",
  accentGlow: "rgba(245,158,11,0.35)",
  danger: "#dc2626",
  ok: "#16a34a",
  radius: 14,
  radiusSm: 10,
} as const;

export const card: React.CSSProperties = {
  background: theme.surface,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radius,
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#ffffff",
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
  background: "transparent",
  color: theme.text,
  border: `1px solid ${theme.border}`,
  borderRadius: theme.radiusSm,
  padding: "10px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
