"use client";
import { useState } from "react";
import {
  X, ArrowRight, ArrowLeft, Home, Building2, Factory, Sprout, Store,
  HelpCircle, CheckCircle2, Loader2, MapPin, Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { COMUNAS, TIPOS } from "./data";

const TIPO_ICON: Record<string, React.ReactNode> = {
  casa: <Home size={22} />,
  departamento: <Building2 size={22} />,
  comercio: <Store size={22} />,
  industria: <Factory size={22} />,
  agricola: <Sprout size={22} />,
  otro: <HelpCircle size={22} />,
};

export type FunnelInit = { tipo?: string; consumo?: number };

const peso = (n: number) =>
  "$" + Math.round(n).toLocaleString("es-CL");

export default function FunnelModal({
  open,
  onClose,
  init,
}: {
  open: boolean;
  onClose: () => void;
  init?: FunnelInit;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    tipo: init?.tipo ?? "",
    consumo: init?.consumo ? String(init.consumo) : "",
    comuna: "",
    direccion: "",
    nombre: "",
    apellido: "",
    correo: "",
    numero: "",
    mensaje: "",
  });

  // keep form synced with the latest calculator values when reopened
  const initKey = `${init?.tipo ?? ""}-${init?.consumo ?? ""}`;
  const [lastKey, setLastKey] = useState(initKey);
  if (open && initKey !== lastKey) {
    setLastKey(initKey);
    setForm((p) => ({
      ...p,
      tipo: init?.tipo || p.tipo,
      consumo: init?.consumo ? String(init.consumo) : p.consumo,
    }));
    setStep(0);
    setDone(false);
  }

  if (!open) return null;

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const consumoNum = Number(form.consumo.replace(/\D/g, "")) || 0;
  const ahorroAnual = Math.round((consumoNum * 0.85 * 12) / 1000) * 1000;

  const canNext =
    step === 0
      ? !!form.tipo && consumoNum > 0
      : step === 1
      ? !!form.comuna && form.direccion.trim().length > 2
      : true;

  const submit = async () => {
    setLoading(true);
    // TODO: enviar a Supabase / API. Por ahora simula como la landing original.
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setDone(true);
  };

  const STEPS = ["Tu propiedad", "Ubicación", "Tus datos"];

  return (
    <div
      className="v2-modal-bg"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        className="v2-modal"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="x" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>

        {done ? (
          <div className="body">
            <div className="v2-success">
              <div className="ring">
                <CheckCircle2 size={38} />
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
                ¡Listo, {form.nombre || "vecino"}! 🎉
              </h2>
              <p
                style={{
                  color: "var(--ink-dim)",
                  fontSize: 15.5,
                  lineHeight: 1.65,
                  maxWidth: 380,
                  margin: "0 auto 8px",
                }}
              >
                Recibimos tu solicitud. Un especialista te contactará en menos
                de <strong style={{ color: "#fff" }}>24 horas</strong> con tu
                propuesta solar personalizada.
              </p>
              {ahorroAnual > 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 6 }}>
                  Ahorro anual estimado:{" "}
                  <strong style={{ color: "var(--gold)" }}>
                    {peso(ahorroAnual)}
                  </strong>
                </p>
              )}
              <button
                className="btn btn-primary btn-lg"
                style={{ marginTop: 24 }}
                onClick={onClose}
              >
                Perfecto, cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="head">
              <div className="v2-steplbl">
                Paso {step + 1} de 3 · {STEPS[step]}
              </div>
              <div className="v2-progress">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={i < step ? "done" : i === step ? "now" : ""}
                  >
                    <i />
                  </span>
                ))}
              </div>
            </div>

            <div className="body">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="s0"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                      ¿Dónde quieres instalar?
                    </h2>
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: 14,
                        marginBottom: 18,
                      }}
                    >
                      Elige el tipo de propiedad para dimensionar tu sistema.
                    </p>
                    <div className="v2-typegrid">
                      {TIPOS.map((t) => (
                        <div
                          key={t.key}
                          className={`v2-typecard ${
                            form.tipo === t.key ? "on" : ""
                          }`}
                          onClick={() => set("tipo", t.key)}
                        >
                          <div className="ti">{TIPO_ICON[t.key]}</div>
                          <div className="tt">{t.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="v2-field" style={{ marginTop: 18 }}>
                      <label>Cuenta de luz mensual aproximada *</label>
                      <input
                        className="v2-input"
                        inputMode="numeric"
                        placeholder="$80.000"
                        value={form.consumo ? peso(consumoNum) : ""}
                        onChange={(e) =>
                          set("consumo", e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                    {ahorroAnual > 0 && (
                      <div className="v2-recap">
                        <div>
                          <div className="k">Ahorro anual estimado</div>
                          <div className="v">{peso(ahorroAnual)}</div>
                        </div>
                        <Sparkles size={22} color="var(--gold)" />
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="s1"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                      ¿Dónde queda la propiedad?
                    </h2>
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: 14,
                        marginBottom: 18,
                      }}
                    >
                      Nos ayuda a calcular la radiación solar de tu zona.
                    </p>
                    <div className="v2-field">
                      <label>Comuna *</label>
                      <select
                        className="v2-select"
                        value={form.comuna}
                        onChange={(e) => set("comuna", e.target.value)}
                      >
                        <option value="">Selecciona tu comuna...</option>
                        {COMUNAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="v2-field">
                      <label>Dirección *</label>
                      <div style={{ position: "relative" }}>
                        <MapPin
                          size={16}
                          style={{
                            position: "absolute",
                            left: 12,
                            top: 14,
                            color: "var(--muted)",
                          }}
                        />
                        <input
                          className="v2-input"
                          style={{ paddingLeft: 36 }}
                          placeholder="Av. Ejemplo 123"
                          value={form.direccion}
                          onChange={(e) => set("direccion", e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="s2"
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                      ¿A quién le enviamos la propuesta?
                    </h2>
                    <p
                      style={{
                        color: "var(--muted)",
                        fontSize: 14,
                        marginBottom: 18,
                      }}
                    >
                      Te contactamos en menos de 24 horas. Sin compromiso.
                    </p>
                    <div className="v2-row2">
                      <div className="v2-field">
                        <label>Nombre *</label>
                        <input
                          className="v2-input"
                          placeholder="Juan"
                          value={form.nombre}
                          onChange={(e) => set("nombre", e.target.value)}
                        />
                      </div>
                      <div className="v2-field">
                        <label>Apellido *</label>
                        <input
                          className="v2-input"
                          placeholder="Pérez"
                          value={form.apellido}
                          onChange={(e) => set("apellido", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="v2-row2">
                      <div className="v2-field">
                        <label>Correo *</label>
                        <input
                          className="v2-input"
                          type="email"
                          placeholder="juan@correo.com"
                          value={form.correo}
                          onChange={(e) => set("correo", e.target.value)}
                        />
                      </div>
                      <div className="v2-field">
                        <label>Teléfono *</label>
                        <input
                          className="v2-input"
                          type="tel"
                          placeholder="+56 9 1234 5678"
                          value={form.numero}
                          onChange={(e) => set("numero", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="v2-field">
                      <label>
                        Mensaje <span className="opt">(opcional)</span>
                      </label>
                      <textarea
                        className="v2-textarea"
                        rows={2}
                        placeholder="Cuéntanos más sobre tu proyecto..."
                        value={form.mensaje}
                        onChange={(e) => set("mensaje", e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="v2-modal-foot">
                {step > 0 && (
                  <button
                    className="btn btn-ghost"
                    style={{ flex: "0 0 auto" }}
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ArrowLeft size={16} /> Atrás
                  </button>
                )}
                {step < 2 ? (
                  <button
                    className="btn btn-primary"
                    disabled={!canNext}
                    style={{ opacity: canNext ? 1 : 0.5 }}
                    onClick={() => canNext && setStep((s) => s + 1)}
                  >
                    Continuar <ArrowRight size={16} className="arrow" />
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={
                      loading ||
                      !form.nombre ||
                      !form.correo ||
                      !form.numero
                    }
                    style={{
                      opacity:
                        loading || !form.nombre || !form.correo || !form.numero
                          ? 0.6
                          : 1,
                    }}
                    onClick={submit}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        Recibir mi propuesta{" "}
                        <ArrowRight size={16} className="arrow" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
