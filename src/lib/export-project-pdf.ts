import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project } from "./types";
import { ESTADO_MAP, IVA } from "./constants";

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
const fmt = (n: number | null | undefined) => (n == null ? "—" : clp.format(n));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function slugify(name: string) {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "proyecto"
  );
}

const BRAND = "#f59e0b";

// Genera y descarga un PDF: (página 1) diseño si existe, (última página) ficha técnica.
export async function exportProjectPdf(designPngDataUrl: string | null, project: Project) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const headerHeight = 18;

  const drawHeader = () => {
    doc.setFillColor(BRAND);
    doc.rect(0, 0, pageW, headerHeight, "F");
    doc.setTextColor("#1a1206");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Era Solar", margin, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Proyecto fotovoltaico", pageW - margin, 12, { align: "right" });
    doc.setTextColor("#000000");
  };

  let firstPage = true;

  // -------- Página de diseño (si hay imagen) --------
  if (designPngDataUrl) {
    try {
      const img = await loadImage(designPngDataUrl);
      // Pasar siempre por canvas => dataURL confiable para addImage (URL remota o dataURL).
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      const png = canvas.toDataURL("image/png");

      drawHeader();
      firstPage = false;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Diseño del proyecto", margin, headerHeight + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(project.nombre, margin, headerHeight + 19);

      const boxTop = headerHeight + 24;
      const boxW = pageW - margin * 2;
      const boxH = pageH - boxTop - margin;
      const ratio = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
      const drawW = img.naturalWidth * ratio;
      const drawH = img.naturalHeight * ratio;
      const x = margin + (boxW - drawW) / 2;
      const y = boxTop + (boxH - drawH) / 2;
      doc.addImage(png, "PNG", x, y, drawW, drawH, undefined, "FAST");
    } catch {
      // si la imagen falla, seguimos solo con la ficha
    }
  }

  // -------- Ficha técnica --------
  if (!firstPage) doc.addPage("a4", "portrait");
  drawHeader();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Ficha técnica del proyecto", margin, headerHeight + 12);

  const neto = project.valor_neto ?? 0;
  const conIva = Math.round(neto * (1 + IVA));
  const kwp =
    project.cantidad_paneles && project.potencia_panel_w
      ? ((project.cantidad_paneles * project.potencia_panel_w) / 1000).toLocaleString("es-CL", {
          maximumFractionDigits: 2,
        }) + " kWp"
      : "—";

  const rows: [string, string][] = [
    ["Proyecto", project.nombre],
    ["Estado", ESTADO_MAP[project.estado].label],
    ["Dirección", project.direccion ?? "—"],
    ["Cliente", project.cliente_nombre ?? "—"],
    ["Teléfono", project.cliente_telefono ?? "—"],
    ["Email", project.cliente_email ?? "—"],
    ["Cantidad de paneles", project.cantidad_paneles != null ? String(project.cantidad_paneles) : "—"],
    ["Modelo de panel", project.modelo_panel ?? "—"],
    ["Potencia por panel", project.potencia_panel_w != null ? `${project.potencia_panel_w} W` : "—"],
    ["Potencia total estimada", kwp],
    ["Inversor", project.modelo_inversor ?? "—"],
    ["Descripción", project.descripcion ?? "—"],
    ["Valor neto (sin IVA)", fmt(project.valor_neto)],
    ["IVA (19%)", fmt(project.valor_neto != null ? conIva - neto : null)],
    ["Valor total (con IVA)", fmt(project.valor_neto != null ? conIva : null)],
  ];

  autoTable(doc, {
    startY: headerHeight + 18,
    margin: { left: margin, right: margin },
    body: rows,
    theme: "grid",
    styles: { fontSize: 10.5, cellPadding: 3, valign: "middle", overflow: "linebreak" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 58, fillColor: "#f1f5f9" },
      1: { cellWidth: "auto" },
    },
  });

  doc.save(`proyecto-${slugify(project.nombre)}.pdf`);
}
