"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, FileDown, Loader2 } from "lucide-react";
import Modal from "@/app/app/_components/Modal";
import ProjectForm from "../../_components/ProjectForm";
import { updateProject, deleteProject } from "../../actions";
import { theme, btnGhost } from "@/lib/theme";
import type { Project } from "@/lib/types";

export default function ProjectHeaderActions({
  project,
  designThumbUrl,
}: {
  project: Project;
  designThumbUrl: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  async function exportPdf() {
    setExporting(true);
    try {
      const { exportProjectPdf } = await import("@/lib/export-project-pdf");
      await exportProjectPdf(designThumbUrl, project);
    } finally {
      setExporting(false);
    }
  }

  function onDelete() {
    if (!confirm(`¿Eliminar el proyecto "${project.nombre}" y todos sus diseños y adjuntos? No se puede deshacer.`)) return;
    start(async () => {
      await deleteProject(project.id);
    });
  }

  const updateAction = updateProject.bind(null, project.id);

  return (
    <>
      <button onClick={exportPdf} disabled={exporting} className="es-btn" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 8 }}>
        {exporting ? <Loader2 size={16} className="es-spin" /> : <FileDown size={16} />}
        PDF
      </button>
      <button onClick={() => setEditing(true)} className="es-btn" style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Pencil size={16} /> Editar
      </button>
      <button
        onClick={onDelete}
        disabled={pending}
        className="es-btn"
        style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)", display: "inline-flex", alignItems: "center", gap: 8 }}
      >
        <Trash2 size={16} /> {pending ? "Eliminando…" : "Eliminar"}
      </button>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar proyecto">
        <ProjectForm
          action={async (fd) => {
            await updateAction(fd);
            setEditing(false);
            router.refresh();
          }}
          initial={project}
          submitLabel="Guardar cambios"
          onCancel={() => setEditing(false)}
        />
      </Modal>
    </>
  );
}
