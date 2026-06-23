"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, PencilRuler } from "lucide-react";
import { theme } from "@/lib/theme";
import type { Design } from "@/lib/types";
import { createDesign, deleteDesign } from "../../actions";

export default function DesignsSection({ projectId, designs }: { projectId: string; designs: Design[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function nuevo() {
    start(async () => {
      await createDesign(projectId);
    });
  }

  function eliminar(id: string) {
    if (!confirm("¿Eliminar este diseño? No se puede deshacer.")) return;
    start(async () => {
      await deleteDesign(id, projectId);
      router.refresh();
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 14,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {designs.map((d) => (
        <div
          key={d.id}
          className="es-card-link"
          style={{ border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden", background: theme.surface, position: "relative" }}
        >
          <button
            onClick={() => eliminar(d.id)}
            title="Eliminar"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 2,
              background: "rgba(0,0,0,0.55)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              display: "grid",
              placeItems: "center",
              color: "#fca5a5",
              cursor: "pointer",
            }}
          >
            <Trash2 size={15} />
          </button>
          <Link href={`/app/proyectos/${projectId}/disenos/${d.id}`} style={{ textDecoration: "none", color: theme.text, display: "block" }}>
            <div
              style={{
                aspectRatio: "4 / 3",
                background: d.thumbnail_url ? "#000" : theme.bgElev,
                display: "grid",
                placeItems: "center",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              {d.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.thumbnail_url} alt={d.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <PencilRuler size={30} color={theme.textFaint} />
              )}
            </div>
            <div style={{ padding: "11px 14px" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.nombre}</div>
              <div style={{ fontSize: 12, color: theme.textFaint, marginTop: 3 }}>
                {new Date(d.updated_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          </Link>
        </div>
      ))}

      <button
        onClick={nuevo}
        disabled={pending}
        style={{
          border: `1px dashed ${theme.borderStrong}`,
          borderRadius: 14,
          background: "transparent",
          color: theme.textMuted,
          cursor: pending ? "wait" : "pointer",
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
        }}
        className="es-card-link"
      >
        <Plus size={26} color={theme.accent} />
        {pending ? "Creando…" : "Nuevo diseño"}
      </button>
    </div>
  );
}
