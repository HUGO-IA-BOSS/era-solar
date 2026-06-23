"use client";

import { useFormStatus } from "react-dom";
import { inputStyle, labelStyle, btnPrimary, theme } from "@/lib/theme";
import { ESTADOS } from "@/lib/constants";
import type { Project } from "@/lib/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="es-btn" style={{ ...btnPrimary, opacity: pending ? 0.7 : 1, cursor: pending ? "wait" : "pointer" }}>
      {pending ? "Guardando…" : label}
    </button>
  );
}

const fullRow: React.CSSProperties = { gridColumn: "1 / -1" };

export default function ProjectForm({
  action,
  initial,
  submitLabel = "Guardar",
  onCancel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: Partial<Project>;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  return (
    <form action={action} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={fullRow}>
        <label style={labelStyle}>Nombre del proyecto *</label>
        <input name="nombre" required defaultValue={initial?.nombre ?? ""} placeholder="Ej: Casa Familia Pérez — Las Condes" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Estado</label>
        <select name="estado" defaultValue={initial?.estado ?? "cotizacion"} style={{ ...inputStyle, appearance: "auto" }}>
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value} style={{ background: theme.surfaceSolid }}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>Dirección</label>
        <input name="direccion" defaultValue={initial?.direccion ?? ""} placeholder="Calle, comuna, ciudad" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Cliente</label>
        <input name="cliente_nombre" defaultValue={initial?.cliente_nombre ?? ""} placeholder="Nombre del cliente" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Teléfono</label>
        <input name="cliente_telefono" defaultValue={initial?.cliente_telefono ?? ""} placeholder="+56 9 ..." style={inputStyle} />
      </div>
      <div style={fullRow}>
        <label style={labelStyle}>Email del cliente</label>
        <input name="cliente_email" type="email" defaultValue={initial?.cliente_email ?? ""} placeholder="cliente@correo.com" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Valor (CLP)</label>
        <input name="valor" inputMode="numeric" defaultValue={initial?.valor_neto ?? ""} placeholder="Ej: 4500000" style={inputStyle} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 13, color: theme.textMuted, cursor: "pointer" }}>
          <input type="checkbox" name="valor_con_iva" /> El monto ingresado incluye IVA
        </label>
      </div>
      <div>
        <label style={labelStyle}>Cantidad de paneles</label>
        <input name="cantidad_paneles" inputMode="numeric" defaultValue={initial?.cantidad_paneles ?? ""} placeholder="Ej: 12" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Modelo de panel</label>
        <input name="modelo_panel" defaultValue={initial?.modelo_panel ?? ""} placeholder="Ej: Trina Vertex S 450W" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Potencia por panel (W)</label>
        <input name="potencia_panel_w" inputMode="numeric" defaultValue={initial?.potencia_panel_w ?? ""} placeholder="Ej: 450" style={inputStyle} />
      </div>

      <div style={fullRow}>
        <label style={labelStyle}>Inversor</label>
        <input name="modelo_inversor" defaultValue={initial?.modelo_inversor ?? ""} placeholder="Ej: Huawei SUN2000 5KTL" style={inputStyle} />
      </div>

      <div style={fullRow}>
        <label style={labelStyle}>Descripción</label>
        <textarea name="descripcion" defaultValue={initial?.descripcion ?? ""} rows={3} placeholder="Notas, alcance del proyecto, observaciones…" style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div style={{ ...fullRow, display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: `1px solid ${theme.border}`, color: theme.textMuted, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
        )}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
