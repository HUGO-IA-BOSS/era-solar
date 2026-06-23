"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { theme, inputStyle } from "@/lib/theme";
import { TIPOS_ADJUNTO, TIPO_ADJUNTO_MAP, STORAGE_ATTACHMENTS } from "@/lib/constants";
import type { Attachment, TipoAdjunto } from "@/lib/types";

function humanSize(n: number | null) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentsManager({
  projectId,
  attachments,
}: {
  projectId: string;
  attachments: Attachment[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<TipoAdjunto>("factura_equipo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${projectId}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_ATTACHMENTS).upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("attachments").insert({
        project_id: projectId,
        tipo,
        nombre: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size: file.size,
      });
      if (insErr) throw insErr;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function download(a: Attachment) {
    const { data, error } = await supabase.storage.from(STORAGE_ATTACHMENTS).createSignedUrl(a.storage_path, 120);
    if (error || !data) {
      setError("No se pudo generar el enlace de descarga");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function remove(a: Attachment) {
    if (!confirm(`¿Eliminar "${a.nombre}"?`)) return;
    setBusy(true);
    await supabase.storage.from(STORAGE_ATTACHMENTS).remove([a.storage_path]);
    await supabase.from("attachments").delete().eq("id", a.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoAdjunto)} style={{ ...inputStyle, width: "auto", appearance: "auto" }}>
          {TIPOS_ADJUNTO.map((t) => (
            <option key={t.value} value={t.value} style={{ background: theme.surfaceSolid }}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: theme.surfaceHover,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "10px 16px",
            color: theme.text,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? <Loader2 size={16} className="es-spin" /> : <Upload size={16} />}
          {busy ? "Subiendo…" : "Subir archivo"}
        </button>
        <input ref={fileRef} type="file" onChange={onFile} style={{ display: "none" }} />
      </div>

      {error && (
        <div style={{ color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      {attachments.length === 0 ? (
        <p style={{ color: theme.textFaint, fontSize: 14 }}>
          Aún no hay documentos. Sube facturas de equipos (garantía), boletas de venta, planos o boletas de luz.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {attachments.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                background: theme.surface,
              }}
            >
              <FileText size={20} color={theme.accent} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nombre}</div>
                <div style={{ fontSize: 12, color: theme.textFaint }}>
                  {TIPO_ADJUNTO_MAP[a.tipo]} · {humanSize(a.size)}
                </div>
              </div>
              <button onClick={() => download(a)} title="Descargar" style={iconBtn}>
                <Download size={16} />
              </button>
              <button onClick={() => remove(a)} title="Eliminar" style={{ ...iconBtn, color: "#fca5a5" }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  width: 34,
  height: 34,
  display: "grid",
  placeItems: "center",
  color: theme.textMuted,
  cursor: "pointer",
  flexShrink: 0,
};
