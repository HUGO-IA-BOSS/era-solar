// Tipos compartidos del backoffice Era Solar.

export type Role = "admin" | "tecnico" | "comercial" | "pendiente";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  created_at: string;
}

export type EstadoProyecto =
  | "cotizacion"
  | "aprobado"
  | "en_instalacion"
  | "instalado"
  | "postventa"
  | "perdido";

export interface Project {
  id: string;
  nombre: string;
  direccion: string | null;
  descripcion: string | null;
  estado: EstadoProyecto;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  // Valor neto (sin IVA) en CLP. El valor con IVA se deriva (× 1.19).
  valor_neto: number | null;
  cantidad_paneles: number | null;
  modelo_panel: string | null;
  potencia_panel_w: number | null;
  modelo_inversor: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoAdjunto =
  | "factura_equipo"
  | "boleta_venta"
  | "plano"
  | "boleta_luz"
  | "otro";

export interface Attachment {
  id: string;
  project_id: string;
  tipo: TipoAdjunto;
  nombre: string;
  storage_path: string;
  mime_type: string | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

// --- Escena del editor de diseños (se guarda como JSONB en `designs.scene`) ---

export interface BgState {
  // URL pública (Supabase Storage) o dataURL de la imagen de fondo.
  src: string | null;
  rotation: number; // grados
}

export interface PanelShape {
  id: string;
  x: number;
  y: number;
  realW: number; // metros (fuente de verdad)
  realH: number; // metros
  rotation: number;
  fill: string;
}

export interface DrawLine {
  id: string;
  tool: "pencil" | "line";
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export interface TextNode {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  rotation: number;
}

export interface Scene {
  version: number;
  pxPerMeter: number | null;
  bg: BgState;
  panels: PanelShape[];
  lines: DrawLine[];
  texts: TextNode[];
}

export interface Design {
  id: string;
  project_id: string;
  nombre: string;
  scene: Scene | null;
  thumbnail_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// --- Finanzas ---

export interface Sociedad {
  id: string;
  nombre: string;
  rut: string | null;
  created_at: string;
}

export type ImputacionTipo = "proyecto" | "sociedad" | "usuario";
export type FondoTipo = "sociedad" | "usuario";
export type MedioPago = "transferencia" | "efectivo" | "cheque" | "tarjeta" | "deposito" | "otro";

export interface Cuota {
  id: string;
  project_id: string;
  nombre: string;
  monto: number;
  fecha_vencimiento: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  proyecto_id: string | null;
  monto_total: number; // total recibido (IVA incluido si aplica)
  tiene_iva: boolean;
  medio_pago: MedioPago;
  fecha_pago: string | null;
  destino_tipo: FondoTipo; // sociedad | usuario (a dónde van los fondos)
  destino_user_id: string | null;
  sociedad_id: string | null;
  folio_factura: string | null;
  factura_path: string | null;
  comprobante_path: string | null;
  descripcion: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleAllocation {
  id: string;
  sale_id: string;
  cuota_id: string;
  monto: number;
  created_at: string;
}

export interface Purchase {
  id: string;
  fecha_compra: string | null;
  proveedor: string | null;
  rut_proveedor: string | null;
  monto_total: number; // total pagado (IVA incluido si aplica)
  tiene_iva: boolean;
  con_factura: boolean;
  factura_a_sociedad: boolean;
  folio_factura: string | null;
  imputacion_tipo: ImputacionTipo;
  proyecto_id: string | null;
  uso_user_id: string | null;
  fondo_tipo: FondoTipo;
  fondo_user_id: string | null;
  sociedad_id: string | null;
  fecha_pago: string | null;
  descripcion: string | null;
  foto_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
