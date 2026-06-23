"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/app/app/_components/Modal";
import ProjectForm from "./ProjectForm";
import { createProject } from "../actions";
import { btnPrimary } from "@/lib/theme";

export default function NewProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="es-btn" style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Plus size={18} /> Nuevo proyecto
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proyecto">
        <ProjectForm action={createProject} submitLabel="Crear proyecto" onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
