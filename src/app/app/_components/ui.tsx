// Componentes presentacionales puros (sin hooks) — seguros en server components.
import { theme } from "@/lib/theme";
import { ESTADO_MAP } from "@/lib/constants";
import type { EstadoProyecto } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 26,
      }}
    >
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{title}</h1>
        {subtitle && (
          <p style={{ color: theme.textMuted, fontSize: 14, margin: "6px 0 0" }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  style,
  pad = 22,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
}) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{children}</h2>
      {right}
    </div>
  );
}

export function EstadoBadge({ estado, size = "md" }: { estado: EstadoProyecto; size?: "sm" | "md" }) {
  const { label, color } = ESTADO_MAP[estado];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `${color}1f`,
        color,
        border: `1px solid ${color}55`,
        borderRadius: 999,
        padding: size === "sm" ? "2px 9px" : "4px 12px",
        fontSize: size === "sm" ? 11 : 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radius,
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: accent ? `${accent}22` : theme.accentSoft,
          filter: "blur(8px)",
        }}
      />
      <div style={{ fontSize: 12.5, color: theme.textMuted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, margin: "8px 0 2px", position: "relative" }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: theme.textFaint }}>{hint}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "54px 20px",
        border: `1px dashed ${theme.border}`,
        borderRadius: theme.radius,
        color: theme.textMuted,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{title}</div>
      {description && <p style={{ fontSize: 14, margin: "8px auto 0", maxWidth: 380 }}>{description}</p>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

export function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: theme.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14.5, marginTop: 4, color: theme.text }}>{value ?? "—"}</div>
    </div>
  );
}
