"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EstadoProyecto } from "@/lib/types";

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}
function str(v: FormDataEntryValue | null): string | null {
  const s = (v == null ? "" : String(v)).trim();
  return s === "" ? null : s;
}

function buildPayload(formData: FormData) {
  let valor = num(formData.get("valor"));
  const conIva = formData.get("valor_con_iva") === "on";
  if (valor != null && conIva) valor = Math.round(valor / 1.19); // guardamos siempre el neto
  return {
    nombre: str(formData.get("nombre")) ?? "Proyecto sin nombre",
    direccion: str(formData.get("direccion")),
    descripcion: str(formData.get("descripcion")),
    estado: (str(formData.get("estado")) ?? "cotizacion") as EstadoProyecto,
    cliente_nombre: str(formData.get("cliente_nombre")),
    cliente_email: str(formData.get("cliente_email")),
    cliente_telefono: str(formData.get("cliente_telefono")),
    valor_neto: valor,
    cantidad_paneles: num(formData.get("cantidad_paneles")),
    modelo_panel: str(formData.get("modelo_panel")),
    potencia_panel_w: num(formData.get("potencia_panel_w")),
    modelo_inversor: str(formData.get("modelo_inversor")),
  };
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...buildPayload(formData), created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/app/proyectos");
  revalidatePath("/app");
  redirect(`/app/proyectos/${data.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(buildPayload(formData)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/proyectos/${id}`);
  revalidatePath("/app/proyectos");
  revalidatePath("/app");
}

export async function updateEstado(id: string, estado: EstadoProyecto) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/proyectos/${id}`);
  revalidatePath("/app/proyectos");
  revalidatePath("/app");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/proyectos");
  revalidatePath("/app");
  redirect("/app/proyectos");
}

export async function createDesign(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { count } = await supabase
    .from("designs")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  const { data, error } = await supabase
    .from("designs")
    .insert({
      project_id: projectId,
      nombre: `Diseño ${Number(count ?? 0) + 1}`,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/app/proyectos/${projectId}/disenos/${data.id}`);
}

export async function deleteDesign(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("designs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/proyectos/${projectId}`);
}
