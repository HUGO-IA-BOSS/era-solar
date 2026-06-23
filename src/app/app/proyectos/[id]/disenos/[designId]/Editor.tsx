"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Stage, Layer, Image as KImage, Rect, Line, Text, Transformer } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import {
  MousePointer2,
  Hand,
  Grid2x2,
  Pencil,
  Minus,
  Type,
  Ruler,
  ImagePlus,
  RotateCw,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Save,
  Download,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { theme } from "@/lib/theme";
import { STORAGE_DESIGNS } from "@/lib/constants";
import type { Design, Scene, PanelShape, DrawLine, TextNode, BgState } from "@/lib/types";

type Tool = "select" | "pan" | "panel" | "pencil" | "line" | "text" | "calibrate";

const PANEL_COLORS = [
  "rgba(37,99,235,0.55)",
  "rgba(245,158,11,0.6)",
  "rgba(34,197,94,0.55)",
  "rgba(239,68,68,0.5)",
  "rgba(255,255,255,0.45)",
];
const PEN_COLORS = ["#ff3b30", "#f59e0b", "#22c55e", "#3b82f6", "#ffffff", "#111111"];

const emptyScene = (): Scene => ({
  version: 1,
  pxPerMeter: null,
  bg: { src: null, rotation: 0 },
  panels: [],
  lines: [],
  texts: [],
});

export default function Editor({
  design,
  projectId,
  projectName,
}: {
  design: Design;
  projectId: string;
  projectName: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const init = design.scene ?? emptyScene();
  const [nombre, setNombre] = useState(design.nombre);
  const [tool, setTool] = useState<Tool>("select");
  const [bg, setBg] = useState<BgState>(init.bg);
  const [pxPerMeter, setPxPerMeter] = useState<number | null>(init.pxPerMeter);
  const [panels, setPanels] = useState<PanelShape[]>(init.panels);
  const [lines, setLines] = useState<DrawLine[]>(init.lines);
  const [texts, setTexts] = useState<TextNode[]>(init.texts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedKind, setSelectedKind] = useState<"panel" | "text" | null>(null);

  // Opciones de herramienta
  const [tplW, setTplW] = useState(1.76);
  const [tplH, setTplH] = useState(1.13);
  const [panelColor, setPanelColor] = useState(PANEL_COLORS[0]);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penWidth, setPenWidth] = useState(3);

  // Estado de stage / zoom
  const [size, setSize] = useState({ w: 1000, h: 640 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Calibración pendiente
  const [calib, setCalib] = useState<number[] | null>(null); // [x1,y1,x2,y2] dibujado
  const [calibPending, setCalibPending] = useState<{ points: number[]; px: number } | null>(null);
  const [calibMeters, setCalibMeters] = useState("");
  const calibFirst = useRef<number[] | null>(null);

  // Historial
  const [history, setHistory] = useState<Scene[]>([structuredClone(init)]);
  const [hIndex, setHIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isDrawing = useRef(false);
  const interacting = useRef(false);
  const restoring = useRef(false);
  const firstRender = useRef(true);
  const [commitTick, setCommitTick] = useState(0);

  // -------- tamaño del stage según contenedor --------
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // -------- historial: snapshot al cambiar estado relevante (fuera de interacción) --------
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (restoring.current) {
      restoring.current = false;
      return;
    }
    if (interacting.current) return;
    const snap = structuredClone({ version: 1, pxPerMeter, bg, panels, lines, texts } as Scene);
    setHistory((h) => [...h.slice(0, hIndex + 1), snap].slice(-60));
    setHIndex((i) => Math.min(i + 1, 59));
    setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels, lines, texts, bg, pxPerMeter, commitTick]);

  const bump = () => setCommitTick((c) => c + 1);

  function applyScene(s: Scene) {
    restoring.current = true;
    setPxPerMeter(s.pxPerMeter);
    setBg(s.bg);
    setPanels(s.panels);
    setLines(s.lines);
    setTexts(s.texts);
    setSelectedId(null);
    setSelectedKind(null);
  }
  function undo() {
    if (hIndex <= 0) return;
    const i = hIndex - 1;
    setHIndex(i);
    applyScene(structuredClone(history[i]));
    setDirty(true);
  }
  function redo() {
    if (hIndex >= history.length - 1) return;
    const i = hIndex + 1;
    setHIndex(i);
    applyScene(structuredClone(history[i]));
    setDirty(true);
  }

  // -------- transformer attach --------
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const stage = tr.getStage();
    const node = selectedKind === "panel" && selectedId ? stage?.findOne("#" + selectedId) : null;
    tr.nodes(node ? [node as Konva.Node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, selectedKind, panels, scale]);

  // -------- teclado --------
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setSelectedKind(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedKind, hIndex, history, panels, texts]);

  function deleteSelected() {
    if (selectedKind === "panel") setPanels((p) => p.filter((x) => x.id !== selectedId));
    else if (selectedKind === "text") setTexts((t) => t.filter((x) => x.id !== selectedId));
    setSelectedId(null);
    setSelectedKind(null);
  }

  // -------- subir imagen de fondo --------
  async function onUploadBg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${design.id}/bg-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(STORAGE_DESIGNS).upload(path, file, { upsert: true });
      if (error) throw error;
      const url = supabase.storage.from(STORAGE_DESIGNS).getPublicUrl(path).data.publicUrl;
      setBg({ src: url, rotation: 0 });
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al subir la imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // -------- pointer handlers --------
  function relPos() {
    return stageRef.current?.getRelativePointerPosition() ?? { x: 0, y: 0 };
  }

  function onPointerDown(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    const stage = stageRef.current;
    if (!stage) return;
    if (tool === "pan") return;

    const clickedEmpty = e.target === stage;
    const p = relPos();

    if (tool === "select") {
      if (clickedEmpty) {
        setSelectedId(null);
        setSelectedKind(null);
      }
      return;
    }
    if (tool === "panel") {
      // Clic sobre un panel existente => se selecciona (su onClick) en vez de soltar otro.
      if (!clickedEmpty) return;
      if (!pxPerMeter) {
        setErr("Primero calibra la escala (herramienta de regla).");
        return;
      }
      const np: PanelShape = {
        id: crypto.randomUUID(),
        x: p.x,
        y: p.y,
        realW: tplW,
        realH: tplH,
        rotation: 0,
        fill: panelColor,
      };
      setPanels((arr) => [...arr, np]);
      // Queda seleccionado para moverlo/girarlo de inmediato.
      setSelectedId(np.id);
      setSelectedKind("panel");
      return;
    }
    if (tool === "text") {
      const nt: TextNode = {
        id: crypto.randomUUID(),
        x: p.x,
        y: p.y,
        text: "Texto",
        fontSize: 20,
        fill: penColor === "#111111" ? "#ffffff" : penColor,
        rotation: 0,
      };
      setTexts((arr) => [...arr, nt]);
      setTool("select");
      return;
    }
    if (tool === "pencil" || tool === "line") {
      isDrawing.current = true;
      interacting.current = true;
      setLines((arr) => [
        ...arr,
        { id: crypto.randomUUID(), tool, points: [p.x, p.y], stroke: penColor, strokeWidth: penWidth },
      ]);
      return;
    }
    if (tool === "calibrate") {
      if (!calibFirst.current) {
        calibFirst.current = [p.x, p.y];
        setCalib([p.x, p.y, p.x, p.y]);
      } else {
        const pts = [calibFirst.current[0], calibFirst.current[1], p.x, p.y];
        setCalib(pts);
        const px = Math.hypot(pts[2] - pts[0], pts[3] - pts[1]);
        setCalibPending({ points: pts, px });
        calibFirst.current = null;
      }
    }
  }

  function onPointerMove() {
    const p = relPos();
    if (tool === "calibrate" && calibFirst.current) {
      setCalib([calibFirst.current[0], calibFirst.current[1], p.x, p.y]);
      return;
    }
    if (!isDrawing.current) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      const points =
        last.tool === "pencil"
          ? last.points.concat([p.x, p.y])
          : [last.points[0], last.points[1], p.x, p.y];
      return [...prev.slice(0, -1), { ...last, points }];
    });
  }

  function onPointerUp() {
    if (isDrawing.current) {
      isDrawing.current = false;
      interacting.current = false;
      bump();
    }
  }

  function confirmCalib() {
    const m = Number(calibMeters.replace(",", "."));
    if (calibPending && m > 0) {
      setPxPerMeter(calibPending.px / m);
    }
    setCalibPending(null);
    setCalib(null);
    setCalibMeters("");
    setTool("select");
  }
  function cancelCalib() {
    setCalibPending(null);
    setCalib(null);
    setCalibMeters("");
  }

  // -------- zoom --------
  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const old = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePt = { x: (pointer.x - stage.x()) / old, y: (pointer.y - stage.y()) / old };
    const next = Math.min(8, Math.max(0.1, e.evt.deltaY > 0 ? old / 1.08 : old * 1.08));
    setScale(next);
    setPos({ x: pointer.x - mousePt.x * next, y: pointer.y - mousePt.y * next });
  }
  function zoomBy(factor: number) {
    const next = Math.min(8, Math.max(0.1, scale * factor));
    const cx = size.w / 2, cy = size.h / 2;
    const mousePt = { x: (cx - pos.x) / scale, y: (cy - pos.y) / scale };
    setScale(next);
    setPos({ x: cx - mousePt.x * next, y: cy - mousePt.y * next });
  }
  const fitTo = useCallback((natW: number, natH: number) => {
    if (!natW || !natH) return;
    const s = Math.min(size.w / natW, size.h / natH) * 0.92;
    setScale(s);
    setPos({ x: (size.w - natW * s) / 2, y: (size.h - natH * s) / 2 });
  }, [size]);

  // -------- guardar --------
  async function save() {
    setSaving(true);
    setErr(null);
    setSelectedId(null);
    setSelectedKind(null);
    trRef.current?.nodes([]);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    let thumbUrl = design.thumbnail_url;
    try {
      const stage = stageRef.current;
      if (stage) {
        const dataUrl = stage.toDataURL({ pixelRatio: 1, mimeType: "image/png" });
        const blob = await (await fetch(dataUrl)).blob();
        const path = `${design.id}/thumb.png`;
        const { error } = await supabase.storage
          .from(STORAGE_DESIGNS)
          .upload(path, blob, { upsert: true, contentType: "image/png" });
        if (!error) {
          thumbUrl = supabase.storage.from(STORAGE_DESIGNS).getPublicUrl(path).data.publicUrl + "?v=" + Date.now();
        }
      }
    } catch {
      /* si falla la miniatura, igual guardamos la escena */
    }
    const scene: Scene = { version: 1, pxPerMeter, bg, panels, lines, texts };
    const { error } = await supabase
      .from("designs")
      .update({ scene, thumbnail_url: thumbUrl, nombre })
      .eq("id", design.id);
    setSaving(false);
    if (error) setErr(error.message);
    else {
      setDirty(false);
      router.refresh();
    }
  }

  function exportPng() {
    setSelectedId(null);
    setSelectedKind(null);
    trRef.current?.nodes([]);
    requestAnimationFrame(() => {
      const uri = stageRef.current?.toDataURL({ pixelRatio: 2, mimeType: "image/png" });
      if (!uri) return;
      const a = document.createElement("a");
      a.download = `${nombre || "diseno"}.png`;
      a.href = uri;
      a.click();
    });
  }

  // editar texto (overlay textarea)
  function editText(id: string, e: Konva.KonvaEventObject<MouseEvent>) {
    const node = e.target as Konva.Text;
    const stage = node.getStage();
    if (!stage) return;
    node.hide();
    trRef.current?.nodes([]);
    const abs = node.absolutePosition();
    const box = stage.container().getBoundingClientRect();
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    ta.value = node.text();
    Object.assign(ta.style, {
      position: "absolute",
      top: `${box.top + window.scrollY + abs.y}px`,
      left: `${box.left + window.scrollX + abs.x}px`,
      fontSize: `${node.fontSize() * stage.scaleX()}px`,
      border: "1px solid #f59e0b",
      borderRadius: "4px",
      padding: "2px 4px",
      margin: "0",
      background: "rgba(20,22,27,0.95)",
      color: node.fill() as string,
      outline: "none",
      resize: "none",
      lineHeight: "1.1",
      fontFamily: "sans-serif",
      zIndex: "1000",
      minWidth: "60px",
    } as CSSStyleDeclaration);
    ta.focus();
    ta.select();
    const finish = () => {
      const val = ta.value;
      setTexts((arr) => arr.map((t) => (t.id === id ? { ...t, text: val } : t)));
      node.show();
      ta.remove();
      window.removeEventListener("mousedown", onOutside);
      bump();
    };
    const onOutside = (ev: MouseEvent) => {
      if (ev.target !== ta) finish();
    };
    ta.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        finish();
      }
      if (ev.key === "Escape") {
        node.show();
        ta.remove();
        window.removeEventListener("mousedown", onOutside);
      }
    });
    setTimeout(() => window.addEventListener("mousedown", onOutside));
  }

  const px = pxPerMeter ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 76px)", minHeight: 520 }}>
      {/* Barra superior */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
        <button onClick={() => router.push(`/app/proyectos/${projectId}`)} style={iconBtn} title="Volver">
          <ArrowLeft size={18} />
        </button>
        <input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setDirty(true);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: theme.text,
            fontSize: 18,
            fontWeight: 700,
            outline: "none",
            minWidth: 120,
          }}
        />
        <span style={{ fontSize: 12, color: theme.textFaint }}>· {projectName}</span>
        <span style={{ fontSize: 12, color: dirty ? theme.accent : theme.ok, marginLeft: 4 }}>
          {dirty ? "● sin guardar" : "✓ guardado"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={exportPng} style={{ ...toolBtn, width: "auto", padding: "0 14px", gap: 7 }}>
            <Download size={16} /> PNG
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`,
              color: "#1a1206",
              border: "none",
              borderRadius: 10,
              padding: "0 18px",
              height: 38,
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? <Loader2 size={16} className="es-spin" /> : <Save size={16} />}
            Guardar
          </button>
        </div>
      </div>

      {/* Toolbar de herramientas */}
      <div style={toolbarRow}>
        <ToolBtn icon={MousePointer2} label="Seleccionar (V)" active={tool === "select"} onClick={() => setTool("select")} />
        <ToolBtn icon={Hand} label="Mover lienzo" active={tool === "pan"} onClick={() => setTool("pan")} />
        <Divider />
        <label style={{ ...toolBtn, cursor: uploading ? "wait" : "pointer" }} title="Subir foto">
          {uploading ? <Loader2 size={18} className="es-spin" /> : <ImagePlus size={18} />}
          <input type="file" accept="image/*" onChange={onUploadBg} style={{ display: "none" }} />
        </label>
        <ToolBtn icon={Ruler} label="Calibrar escala" active={tool === "calibrate"} onClick={() => { setTool("calibrate"); calibFirst.current = null; setCalib(null); }} />
        <ToolBtn icon={Grid2x2} label="Agregar paneles" active={tool === "panel"} onClick={() => setTool("panel")} />
        <ToolBtn icon={Pencil} label="Lápiz" active={tool === "pencil"} onClick={() => setTool("pencil")} />
        <ToolBtn icon={Minus} label="Línea recta" active={tool === "line"} onClick={() => setTool("line")} />
        <ToolBtn icon={Type} label="Texto" active={tool === "text"} onClick={() => setTool("text")} />
        <Divider />
        <ToolBtn icon={Undo2} label="Deshacer" onClick={undo} disabled={hIndex <= 0} />
        <ToolBtn icon={Redo2} label="Rehacer" onClick={redo} disabled={hIndex >= history.length - 1} />
        <ToolBtn icon={Trash2} label="Borrar selección" onClick={deleteSelected} disabled={!selectedId} />
        <Divider />
        <ToolBtn icon={ZoomOut} label="Alejar" onClick={() => zoomBy(1 / 1.2)} />
        <span style={{ fontSize: 12, color: theme.textMuted, width: 42, textAlign: "center" }}>{Math.round(scale * 100)}%</span>
        <ToolBtn icon={ZoomIn} label="Acercar" onClick={() => zoomBy(1.2)} />

        <span style={{ marginLeft: "auto", fontSize: 12.5, color: pxPerMeter ? theme.ok : theme.textFaint, fontWeight: 600 }}>
          {pxPerMeter ? `Escala: ${px.toFixed(1)} px/m` : "Sin escala — calibra con la regla"}
        </span>
      </div>

      {/* Opciones contextuales */}
      <div style={optionsRow}>
        {bg.src && (
          <div style={optGroup}>
            <RotateCw size={15} color={theme.textMuted} />
            <input
              type="range"
              min={-180}
              max={180}
              value={bg.rotation}
              onChange={(e) => setBg((b) => ({ ...b, rotation: Number(e.target.value) }))}
              style={{ width: 130 }}
            />
            <span style={{ fontSize: 12, color: theme.textMuted, width: 36 }}>{bg.rotation}°</span>
            <button style={miniBtn} onClick={() => setBg((b) => ({ ...b, rotation: 0 }))}>Reset</button>
          </div>
        )}

        {tool === "panel" && (
          <div style={optGroup}>
            <span style={optLabel}>Panel (m):</span>
            <input type="number" step="0.01" value={tplW} onChange={(e) => setTplW(Number(e.target.value))} style={numInput} />
            <span style={{ color: theme.textFaint }}>×</span>
            <input type="number" step="0.01" value={tplH} onChange={(e) => setTplH(Number(e.target.value))} style={numInput} />
            <Swatches colors={PANEL_COLORS} value={panelColor} onChange={setPanelColor} />
            {!pxPerMeter ? (
              <span style={{ fontSize: 12, color: theme.accent }}>← calibra primero</span>
            ) : (
              <span style={{ fontSize: 12, color: theme.textFaint }}>
                Clic en vacío para soltar · clic en un panel para moverlo/girarlo (tirador superior)
              </span>
            )}
          </div>
        )}

        {(tool === "pencil" || tool === "line" || tool === "text") && (
          <div style={optGroup}>
            <span style={optLabel}>Color:</span>
            <Swatches colors={PEN_COLORS} value={penColor} onChange={setPenColor} />
            {tool !== "text" && (
              <>
                <span style={optLabel}>Grosor:</span>
                <input type="range" min={1} max={14} value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} style={{ width: 90 }} />
              </>
            )}
          </div>
        )}

        {tool === "select" && (
          <span style={{ fontSize: 12.5, color: theme.textFaint }}>
            {selectedKind === "panel"
              ? "Panel seleccionado — arrastra para mover, usa los tiradores para rotar/redimensionar, Supr para borrar."
              : selectedKind === "text"
              ? "Texto seleccionado — doble clic para editar, Supr para borrar."
              : "Haz clic en un panel o texto para seleccionarlo."}
          </span>
        )}
      </div>

      {err && (
        <div style={{ color: "#fca5a5", fontSize: 13, padding: "6px 0" }} onClick={() => setErr(null)}>
          {err} <span style={{ color: theme.textFaint }}>(clic para cerrar)</span>
        </div>
      )}

      {/* Lienzo */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          border: `1px solid ${theme.border}`,
          borderRadius: 14,
          overflow: "hidden",
          background:
            "repeating-conic-gradient(#15171c 0% 25%, #101216 0% 50%) 50% / 22px 22px",
          cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair",
        }}
      >
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={scale}
          scaleY={scale}
          x={pos.x}
          y={pos.y}
          draggable={tool === "pan"}
          onDragEnd={(e) => {
            if (tool === "pan") setPos({ x: e.target.x(), y: e.target.y() });
          }}
          onWheel={onWheel}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        >
          <Layer listening={false}>
            <BackgroundImage bg={bg} onReady={fitTo} />
          </Layer>

          <Layer>
            {panels.map((p) => (
              <PanelRect
                key={p.id}
                shape={p}
                px={px || 1}
                draggable={tool === "select" || tool === "panel"}
                isSelected={selectedId === p.id}
                onSelect={() => {
                  if (tool === "select" || tool === "panel") {
                    setSelectedId(p.id);
                    setSelectedKind("panel");
                  }
                }}
                onChange={(s) => setPanels((arr) => arr.map((x) => (x.id === s.id ? s : x)))}
              />
            ))}
          </Layer>

          <Layer>
            {lines.map((l) => (
              <Line
                key={l.id}
                points={l.points}
                stroke={l.stroke}
                strokeWidth={l.strokeWidth}
                lineCap="round"
                lineJoin="round"
                tension={l.tool === "pencil" ? 0.4 : 0}
                listening={false}
              />
            ))}
            {texts.map((t) => (
              <Text
                key={t.id}
                id={t.id}
                x={t.x}
                y={t.y}
                text={t.text}
                fontSize={t.fontSize}
                fill={t.fill}
                rotation={t.rotation}
                draggable={tool === "select"}
                onClick={() => {
                  if (tool === "select") {
                    setSelectedId(t.id);
                    setSelectedKind("text");
                  }
                }}
                onTap={() => {
                  if (tool === "select") {
                    setSelectedId(t.id);
                    setSelectedKind("text");
                  }
                }}
                onDblClick={(e) => editText(t.id, e)}
                onDragEnd={(e) => {
                  const x = e.target.x();
                  const y = e.target.y();
                  setTexts((arr) => arr.map((z) => (z.id === t.id ? { ...z, x, y } : z)));
                }}
              />
            ))}
            {calib && <Line points={calib} stroke="#ff3b30" strokeWidth={2 / scale} dash={[8 / scale, 5 / scale]} listening={false} />}
          </Layer>

          <Layer>
            <Transformer
              ref={trRef}
              rotateEnabled
              keepRatio={false}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              rotateAnchorOffset={28}
              anchorSize={10}
              anchorCornerRadius={2}
              anchorStroke={theme.accent}
              anchorFill="#fff"
              borderStroke={theme.accent}
              borderStrokeWidth={1.5}
              boundBoxFunc={(oldB, newB) => (newB.width < 6 || newB.height < 6 ? oldB : newB)}
            />
          </Layer>
        </Stage>

        {/* Botón ajustar */}
        <button
          onClick={() => {
            const img = stageRef.current?.findOne("#bgimg") as Konva.Image | undefined;
            if (img) fitTo(img.width(), img.height());
            else {
              setScale(1);
              setPos({ x: 0, y: 0 });
            }
          }}
          title="Ajustar a la vista"
          style={{ position: "absolute", bottom: 14, right: 14, ...iconBtn }}
        >
          <Maximize2 size={18} />
        </button>

        {/* Overlay calibración */}
        {calibPending && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ background: theme.surfaceSolid, border: `1px solid ${theme.borderStrong}`, borderRadius: 14, padding: 22, width: 320, textAlign: "center" }}>
              <Ruler size={26} color={theme.accent} style={{ margin: "0 auto 10px", display: "block" }} />
              <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Definir escala</h3>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: "0 0 16px" }}>
                ¿Cuánto mide en la realidad el segmento que dibujaste?
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                <input
                  autoFocus
                  value={calibMeters}
                  onChange={(e) => setCalibMeters(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmCalib()}
                  placeholder="10"
                  inputMode="decimal"
                  style={{ ...numInput, width: 90, textAlign: "center", fontSize: 16 }}
                />
                <span style={{ color: theme.textMuted }}>metros</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button style={{ ...miniBtn, flex: 1, padding: "9px" }} onClick={cancelCalib}>Cancelar</button>
                <button
                  style={{ flex: 1, padding: "9px", background: theme.accent, color: "#1a1206", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                  onClick={confirmCalib}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- subcomponentes ----------------

function BackgroundImage({ bg, onReady }: { bg: BgState; onReady: (w: number, h: number) => void }) {
  const [image] = useImage(bg.src ?? "", "anonymous");
  const reportedFor = useRef<string | null>(null);
  useEffect(() => {
    if (image && bg.src && reportedFor.current !== bg.src) {
      reportedFor.current = bg.src;
      onReady(image.width, image.height);
    }
  }, [image, bg.src, onReady]);
  if (!image) return null;
  const w = image.width;
  const h = image.height;
  return (
    <KImage
      id="bgimg"
      image={image}
      x={w / 2}
      y={h / 2}
      offsetX={w / 2}
      offsetY={h / 2}
      rotation={bg.rotation}
      width={w}
      height={h}
      listening={false}
    />
  );
}

function PanelRect({
  shape,
  px,
  draggable,
  isSelected,
  onSelect,
  onChange,
}: {
  shape: PanelShape;
  px: number;
  draggable: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (s: PanelShape) => void;
}) {
  const ref = useRef<Konva.Rect>(null);
  return (
    <Rect
      id={shape.id}
      ref={ref}
      x={shape.x}
      y={shape.y}
      width={shape.realW * px}
      height={shape.realH * px}
      rotation={shape.rotation}
      fill={shape.fill}
      stroke={isSelected ? "#f59e0b" : "rgba(255,255,255,0.85)"}
      strokeWidth={isSelected ? 2 : 1}
      strokeScaleEnabled={false}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ ...shape, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = ref.current;
        if (!node) return;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          realW: Math.max(0.05, (node.width() * sx) / px),
          realH: Math.max(0.05, (node.height() * sy) / px),
        });
      }}
    />
  );
}

// ---------------- UI helpers ----------------

const iconBtn: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: `1px solid ${theme.border}`,
  background: theme.surface,
  color: theme.text,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const toolBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9,
  border: `1px solid ${theme.border}`,
  background: "transparent",
  color: theme.textMuted,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const toolbarRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: 8,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  background: theme.bgElev,
  flexWrap: "wrap",
  marginBottom: 8,
};

const optionsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  minHeight: 30,
  flexWrap: "wrap",
  marginBottom: 8,
};

const optGroup: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const optLabel: React.CSSProperties = { fontSize: 12.5, color: theme.textMuted, fontWeight: 600 };
const numInput: React.CSSProperties = {
  width: 64,
  background: "rgba(0,0,0,0.25)",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: "6px 8px",
  color: theme.text,
  fontSize: 13,
  outline: "none",
};
const miniBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: "6px 10px",
  color: theme.textMuted,
  fontSize: 12,
  cursor: "pointer",
};

function ToolBtn({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      style={{
        ...toolBtn,
        background: active ? theme.accentSoft : "transparent",
        borderColor: active ? "rgba(245,158,11,0.5)" : theme.border,
        color: active ? theme.accent : theme.textMuted,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon size={18} color={active ? theme.accent : theme.textMuted} />
    </button>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 26, background: theme.border, margin: "0 3px" }} />;
}

function Swatches({ colors, value, onChange }: { colors: string[]; value: string; onChange: (c: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: c,
            border: value === c ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
            cursor: "pointer",
          }}
        />
      ))}
    </div>
  );
}
