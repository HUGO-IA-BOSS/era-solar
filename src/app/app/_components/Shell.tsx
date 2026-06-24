"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  Building2,
  LogOut,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { theme } from "@/lib/theme";
import { ROLE_MAP } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { signOut } from "@/app/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
};

const SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/app/proyectos", label: "Proyectos", icon: FolderKanban },
    ],
  },
  {
    title: "Finanzas",
    items: [{ href: "/app/compras", label: "Compras", icon: Receipt }],
  },
  {
    title: "Administración",
    items: [
      { href: "/app/sociedades", label: "Sociedades", icon: Building2, adminOnly: true },
      { href: "/app/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
    ],
  },
];

export default function Shell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: theme.bg, color: theme.text }}>
      {/* Sidebar */}
      <aside
        className="es-sidebar"
        data-open={mobileOpen}
        style={{
          width: 248,
          flexShrink: 0,
          borderRight: `1px solid ${theme.border}`,
          background: theme.bgElev,
          display: "flex",
          flexDirection: "column",
          padding: "22px 16px",
          position: "sticky",
          top: 0,
          height: "100dvh",
        }}
      >
        <Link
          href="/app"
          onClick={() => setMobileOpen(false)}
          style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: theme.text, marginBottom: 28, padding: "0 6px" }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              color: "#1a1206",
            }}
          >
            <Sun size={21} />
          </span>
          <span>
            <span style={{ display: "block", fontWeight: 700, fontSize: 15, lineHeight: 1 }}>Era Solar</span>
            <span style={{ display: "block", fontSize: 11, color: theme.textFaint, marginTop: 3 }}>Backoffice</span>
          </span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {SECTIONS.map((section, si) => {
            const items = section.items.filter((n) => !n.adminOnly || profile.role === "admin");
            if (items.length === 0) return null;
            return (
              <div key={si} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {section.title && (
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: theme.textFaint,
                      padding: "4px 12px 2px",
                    }}
                  >
                    {section.title}
                  </div>
                )}
                {items.map((n) => {
                  const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setMobileOpen(false)}
                      className="es-navlink"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 10,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 600,
                        color: active ? theme.text : theme.textMuted,
                        background: active ? theme.accentSoft : "transparent",
                        border: `1px solid ${active ? "rgba(245,158,11,0.25)" : "transparent"}`,
                      }}
                    >
                      <Icon size={18} color={active ? theme.accent : theme.textMuted} />
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 18, borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 12px" }}>
            <Avatar profile={profile} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile.full_name || profile.email}
              </div>
              <div style={{ fontSize: 11, color: theme.textFaint }}>{ROLE_MAP[profile.role]}</div>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="es-navlink"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.textMuted,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Backdrop móvil */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="es-backdrop"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40 }}
        />
      )}

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header
          className="es-topbar"
          style={{
            display: "none",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.bgElev,
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            onClick={() => setMobileOpen((v) => !v)}
            style={{ background: "transparent", border: "none", color: theme.text, cursor: "pointer", padding: 4 }}
            aria-label="Menú"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span style={{ fontWeight: 700 }}>Era Solar</span>
        </header>

        <main style={{ flex: 1, minWidth: 0, padding: "clamp(20px, 3vw, 38px)" }}>{children}</main>
      </div>
    </div>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  const initials = (profile.full_name || profile.email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  if (profile.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={profile.avatar_url}
        alt=""
        width={34}
        height={34}
        style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <span
      style={{
        width: 34,
        height: 34,
        flexShrink: 0,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: theme.surfaceHover,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {initials}
    </span>
  );
}
