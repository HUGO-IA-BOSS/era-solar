"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Sun, ArrowRight, ChevronRight, Star, ShieldCheck, Zap, Smartphone,
  Wallet, Leaf, Plus, MessageCircle, Sparkles, Clock,
  TrendingUp, Cpu, MapPin, Mail, Phone,
} from "lucide-react";
import { Reveal, CountUp, motion } from "./primitives";
import FunnelModal, { type FunnelInit } from "./FunnelModal";
import {
  BRANDS, SOLUTIONS, STEPS, TESTIMONIALS, FAQS, TIPOS,
  WA_NUMBER, EMAIL,
} from "./data";

/* ---------- helpers ---------- */
const clp = (n: number) => "$" + Math.round(n).toLocaleString("es-CL");
const compact = (n: number) =>
  n >= 1_000_000
    ? (n / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "M"
    : Math.round(n).toLocaleString("es-CL");

const AVATARS = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80",
];

export default function V2() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [init, setInit] = useState<FunnelInit>({});

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const launch = (i: FunnelInit = {}) => {
    setInit(i);
    setOpen(true);
  };

  /* ---------- calculator state ---------- */
  const [bill, setBill] = useState(80000);
  const [tipo, setTipo] = useState("casa");
  const billPct = ((bill - 20000) / (500000 - 20000)) * 100;

  const calc = useMemo(() => {
    const monthlySave = bill * 0.85;
    const annual = monthlySave * 12;
    // proyección a 25 años con escalada de precio energético ~4% anual
    const factor25 = (Math.pow(1.04, 25) - 1) / 0.04; // ≈ 41.6
    const save25 = annual * factor25;
    const kwhMonth = bill / 160; // ~$160/kWh
    const co2Year = (kwhMonth * 12 * 0.4) / 1000; // ton CO2 (factor red ~0.4)
    const trees = (kwhMonth * 12 * 0.4) / 21; // árboles equivalentes/año
    const kWp = Math.max(1, kwhMonth / 120); // 1 kWp ≈ 120 kWh/mes
    const panels = Math.ceil((kWp * 1000) / 550); // paneles de 550W
    return { monthlySave, annual, save25, co2Year, trees, kWp, panels };
  }, [bill]);

  return (
    <div className="v2">
      {/* ===== background ===== */}
      <div className="v2-bg">
        <div className="v2-orb a" />
        <div className="v2-orb b" />
        <div className="v2-orb c" />
      </div>
      <div className="v2-grid" />
      <div className="v2-grain" />

      <FunnelModal open={open} onClose={() => setOpen(false)} init={init} />

      {/* ===== NAV ===== */}
      <nav className={`v2-nav ${solid ? "solid" : ""}`}>
        <div className="wrap">
          <div className="v2-logo">
            <span className="mark">
              <Sun size={17} color="#1a1206" />
            </span>
            Era<span style={{ color: "var(--gold)" }}>Solar</span>
          </div>
          <div className="v2-navlinks">
            <a href="#calculadora" className="hide-sm">Calculadora</a>
            <a href="#beneficios" className="hide-sm">Beneficios</a>
            <a href="#proceso" className="hide-sm">Cómo funciona</a>
            <a href="#faq" className="hide-sm">Preguntas</a>
            <button className="btn btn-primary btn-sm" onClick={() => launch()}>
              Consultoría gratis <ArrowRight size={15} className="arrow" />
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="v2-hero">
        <div className="wrap v2-hero-grid">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="eyebrow">
                <Sun size={14} /> Energía solar inteligente · Chile
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              Ahorra hasta <span className="grad-text">100%</span> en tu cuenta de luz
            </motion.h1>

            <motion.p
              className="sub"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Diseñamos, instalamos y monitoreamos tu sistema solar fotovoltaico.
              Empiezas a ahorrar desde el primer mes — con ingeniería real,
              garantía de 10 años y monitoreo 24/7.
            </motion.p>

            <motion.div
              className="v2-cta-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            >
              <button className="btn btn-primary btn-lg" onClick={() => launch()}>
                Calcular mi ahorro <ArrowRight size={18} className="arrow" />
              </button>
              <a className="btn btn-ghost btn-lg" href="#calculadora">
                Ver calculadora
              </a>
            </motion.div>

            <motion.div
              className="v2-trust"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="v2-avatars">
                {AVATARS.map((a, i) => (
                  <span key={i} style={{ backgroundImage: `url(${a})` }} />
                ))}
              </div>
              <div>
                <div className="v2-stars">★★★★★</div>
                <div style={{ fontSize: 13.5, color: "var(--ink-dim)" }}>
                  +1.000 instalaciones en Chile
                </div>
              </div>
            </motion.div>
          </div>

          {/* hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="v2-hero-card">
              <div
                className="photo"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1100&q=80)",
                }}
              />
              <motion.div
                className="v2-float tl"
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="k">Generando ahora</div>
                <div className="v" style={{ color: "var(--gold)" }}>
                  6,4 kW
                </div>
                <div className="v2-spark">
                  <Zap size={13} /> Sistema activo
                </div>
              </motion.div>
              <motion.div
                className="v2-float br"
                animate={{ y: [0, 9, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="k">Ahorro este mes</div>
                <div className="v">$142.300</div>
                <div className="v2-spark">
                  <TrendingUp size={13} /> −87% boleta
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ===== MARQUEE / trust ===== */}
      <section className="v2-marquee">
        <div className="lbl">Tecnología de primer nivel · certificación SEC</div>
        <div className="v2-track">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i}>{b}</span>
          ))}
        </div>
      </section>

      {/* ===== CALCULATOR ===== */}
      <section className="section" id="calculadora">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 40 }}>
            <span className="eyebrow">
              <Cpu size={14} /> Calculadora de ahorro
            </span>
            <h2 className="h-lead" style={{ margin: "18px 0 12px" }}>
              ¿Cuánto puedes <span className="grad-text">ahorrar</span>?
            </h2>
            <p className="sub center">
              Mueve la barra según tu cuenta de luz y descubre tu ahorro
              estimado en segundos.
            </p>
          </Reveal>

          <Reveal>
            <div className="glass v2-calc">
              {/* left: input */}
              <div className="left">
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                  Tu cuenta de luz mensual
                </div>
                <div className="v2-bill grad-text">{clp(bill)}</div>
                <input
                  className="v2-slider"
                  type="range"
                  min={20000}
                  max={500000}
                  step={5000}
                  value={bill}
                  onChange={(e) => setBill(Number(e.target.value))}
                  style={{ ["--p" as string]: `${billPct}%` } as React.CSSProperties}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--muted)",
                  }}
                >
                  <span>$20.000</span>
                  <span>$500.000+</span>
                </div>

                <div style={{ fontSize: 13, color: "var(--muted)", margin: "22px 0 8px" }}>
                  Tipo de propiedad
                </div>
                <div className="v2-chips">
                  {TIPOS.slice(0, 5).map((t) => (
                    <button
                      key={t.key}
                      className={`v2-chip ${tipo === t.key ? "on" : ""}`}
                      onClick={() => setTipo(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13.5,
                    color: "var(--ink-dim)",
                  }}
                >
                  <Cpu size={16} color="var(--gold)" />
                  Sistema sugerido:{" "}
                  <strong style={{ color: "#fff" }}>
                    {calc.kWp.toFixed(1)} kWp · {calc.panels} paneles
                  </strong>
                </div>
              </div>

              {/* right: results */}
              <div className="right">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  Ahorro estimado al mes
                </div>
                <div className="v2-bignum grad-text">{clp(calc.monthlySave)}</div>

                <div className="v2-statline">
                  <div className="glass">
                    <div className="v" style={{ color: "var(--gold)" }}>
                      {clp(calc.annual)}
                    </div>
                    <div className="k">Ahorro al año</div>
                  </div>
                  <div className="glass">
                    <div className="v" style={{ color: "var(--gold)" }}>
                      ${compact(calc.save25)}
                    </div>
                    <div className="k">Proyección a 25 años</div>
                  </div>
                  <div className="glass">
                    <div className="v" style={{ color: "var(--emerald)" }}>
                      {calc.co2Year.toFixed(1)} t
                    </div>
                    <div className="k">CO₂ evitado al año</div>
                  </div>
                  <div className="glass">
                    <div className="v" style={{ color: "var(--emerald)" }}>
                      {Math.round(calc.trees)}
                    </div>
                    <div className="k">Árboles equivalentes</div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => launch({ tipo, consumo: bill })}
                >
                  Ver mi plan solar <ArrowRight size={18} className="arrow" />
                </button>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  * Estimación referencial. Tu propuesta exacta se calcula en la
                  consultoría gratuita.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== IMPACT STRIP ===== */}
      <section className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <Reveal>
          <div
            className="glass"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
              padding: "34px 28px",
              textAlign: "center",
            }}
          >
            {[
              { v: <CountUp to={1000} suffix="+" />, l: "Paneles instalados" },
              { v: <CountUp to={4} suffix=" días" />, l: "Instalación promedio" },
              { v: <CountUp to={10} suffix=" años" />, l: "Garantía de obra" },
              { v: <CountUp to={87} suffix="%" />, l: "Ahorro promedio" },
            ].map((s, i) => (
              <div key={i}>
                <div
                  className="grad-text"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(26px,3.4vw,38px)",
                    fontWeight: 700,
                  }}
                >
                  {s.v}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 4 }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== BENTO BENEFITS ===== */}
      <section className="section" id="beneficios">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 44 }}>
            <span className="eyebrow">
              <Sparkles size={14} /> Por qué EraSolar
            </span>
            <h2 className="h-lead" style={{ margin: "18px 0 12px" }}>
              Ingeniería solar, <span className="grad-text">sin letra chica</span>
            </h2>
            <p className="sub center">
              Más de 10 años instalando sistemas fotovoltaicos en Chile, con foco
              en calidad, garantía real y acompañamiento total.
            </p>
          </Reveal>

          <Reveal>
            <div className="v2-bento">
              <div className="cell span3 tall">
                <div className="ico"><Wallet size={22} /></div>
                <h3>Ahorro desde el primer mes</h3>
                <p>
                  Con net billing, los excedentes que generas se descuentan de tu
                  boleta. La mayoría de nuestros clientes reduce entre 70% y 100%
                  su cuenta de luz.
                </p>
                <div style={{ flex: 1 }} />
                <div className="v2-spark" style={{ marginTop: 16 }}>
                  <TrendingUp size={15} /> Hasta −100% en tu boleta
                </div>
              </div>
              <div className="cell span3 tall">
                <div className="ico"><Smartphone size={22} /></div>
                <h3>Monitoreo 24/7 desde tu celular</h3>
                <p>
                  App que muestra tu generación, consumo y ahorro en tiempo real.
                  Recibe alertas y mantén el control total de tu energía.
                </p>
                <div style={{ flex: 1 }} />
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-end",
                    height: 46,
                  }}
                >
                  {[40, 70, 55, 90, 65, 100, 80].map((h, i) => (
                    <motion.span
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.06 }}
                      style={{
                        width: 12,
                        borderRadius: 4,
                        background:
                          "linear-gradient(to top, var(--amber), var(--gold))",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="cell span2">
                <div className="ico"><ShieldCheck size={22} /></div>
                <h3>Garantía de 10 años</h3>
                <p>Paneles Tier 1 y mantención correctiva gratuita el primer año.</p>
              </div>
              <div className="cell span2">
                <div className="ico"><Zap size={22} /></div>
                <h3>Instalación en 4 días</h3>
                <p>Equipo certificado SEC. Diseño, montaje y conexión a la red.</p>
              </div>
              <div className="cell span2">
                <div className="ico"><Leaf size={22} /></div>
                <h3>100% energía limpia</h3>
                <p>Reduce tu huella de carbono mientras ahorras cada mes.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== PROCESS ===== */}
      <section className="section" id="proceso">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 50 }}>
            <span className="eyebrow">
              <Clock size={14} /> Proceso simple
            </span>
            <h2 className="h-lead" style={{ margin: "18px 0 12px" }}>
              De la consulta a tu <span className="grad-text">primer kWh</span>
            </h2>
            <p className="sub center">En 4 pasos, sin complicaciones.</p>
          </Reveal>

          <div className="v2-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.1}>
                <div className="glass v2-step">
                  <div className="num">{s.n}</div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLUTIONS ===== */}
      <section className="section">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 44 }}>
            <span className="eyebrow">
              <Sun size={14} /> Soluciones
            </span>
            <h2 className="h-lead" style={{ margin: "18px 0 12px" }}>
              Una solución para <span className="grad-text">cada necesidad</span>
            </h2>
          </Reveal>

          <div className="v2-sol">
            {SOLUTIONS.map((s, i) => (
              <Reveal key={s.tag} delay={i * 0.1}>
                <div className="card" onClick={() => launch()}>
                  <div
                    className="img"
                    style={{ backgroundImage: `url(${s.img})` }}
                  />
                  <div className="body">
                    <div className="tag">{s.tag}</div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                    <span className="v2-link">
                      Consultar <ChevronRight size={15} />
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 44 }}>
            <span className="eyebrow">
              <Star size={14} /> Lo que dicen nuestros clientes
            </span>
            <h2 className="h-lead" style={{ margin: "18px 0 12px" }}>
              +1.000 hogares ya <span className="grad-text">generan lo suyo</span>
            </h2>
          </Reveal>

          <div className="v2-tst">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className="card">
                  <div className="stars">★★★★★</div>
                  <p className="quote">“{t.quote}”</p>
                  <div className="who">
                    <div
                      className="ph"
                      style={{ backgroundImage: `url(${t.ph})` }}
                    />
                    <div>
                      <div className="nm">{t.name}</div>
                      <div className="rl">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section" id="faq">
        <div className="wrap">
          <Reveal className="center" style={{ marginBottom: 36 }}>
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2 className="h-lead" style={{ margin: "18px 0 0" }}>
              Resolvemos tus <span className="grad-text">dudas</span>
            </h2>
          </Reveal>
          <Reveal>
            <FAQList />
          </Reveal>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="v2-final">
        <div className="wrap">
          <Reveal>
            <div className="box">
              <div className="v2-urgency">
                <Clock size={14} /> Cupos limitados para instalación este mes
              </div>
              <h2>
                Empieza a ahorrar <span className="grad-text">hoy</span>
              </h2>
              <p className="sub center">
                Solicita tu consultoría gratuita y recibe una propuesta solar
                personalizada en menos de 24 horas. Sin costo, sin compromiso.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => launch()}
                style={{ margin: "0 auto" }}
              >
                Quiero mi propuesta gratis <ArrowRight size={18} className="arrow" />
              </button>
              <div
                style={{
                  display: "flex",
                  gap: 22,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 26,
                  color: "var(--muted)",
                  fontSize: 13.5,
                }}
              >
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <ShieldCheck size={15} color="var(--emerald)" /> Garantía 10 años
                </span>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <Zap size={15} color="var(--emerald)" /> Instalación en 4 días
                </span>
                <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <Wallet size={15} color="var(--emerald)" /> Con financiamiento
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="v2-foot">
        <div className="wrap">
          <div className="row">
            <div style={{ maxWidth: 320 }}>
              <div className="v2-logo" style={{ marginBottom: 14 }}>
                <span className="mark">
                  <Sun size={17} color="#1a1206" />
                </span>
                Era<span style={{ color: "var(--gold)" }}>Solar</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                Energía solar fotovoltaica para hogares, comercios e industrias en
                todo Chile.
              </p>
            </div>
            <div className="links">
              <a href="#calculadora">Calculadora</a>
              <a href="#beneficios">Beneficios</a>
              <a href="#proceso">Cómo funciona</a>
              <a href="#faq">Preguntas</a>
            </div>
            <div className="links" style={{ flexDirection: "column", gap: 12 }}>
              <a href={`mailto:${EMAIL}`} style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <Mail size={14} /> {EMAIL}
              </a>
              <a href={`https://wa.me/${WA_NUMBER}`} style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <Phone size={14} /> +56 9 XXXX XXXX
              </a>
              <span style={{ display: "inline-flex", gap: 7, alignItems: "center" }}>
                <MapPin size={14} /> Región Metropolitana y regiones
              </span>
            </div>
          </div>
          <div className="bottom">
            <span>© 2025 EraSolar SpA · Todos los derechos reservados</span>
            <span>Hecho con energía del sol ☀</span>
          </div>
        </div>
      </footer>

      {/* ===== floating WhatsApp ===== */}
      <a
        className="v2-wa"
        href={`https://wa.me/${WA_NUMBER}?text=Hola%20EraSolar,%20quiero%20cotizar%20paneles%20solares`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <MessageCircle size={26} />
      </a>

      {/* ===== sticky mobile CTA ===== */}
      <div className="v2-stickybar">
        <button
          className="btn btn-primary"
          onClick={() => launch()}
        >
          Calcular mi ahorro gratis <ArrowRight size={16} className="arrow" />
        </button>
      </div>
    </div>
  );
}

/* ---------- FAQ accordion ---------- */
function FAQList() {
  const [openI, setOpenI] = useState<number | null>(0);
  return (
    <div className="v2-faq">
      {FAQS.map((f, i) => {
        const isOpen = openI === i;
        return (
          <div key={i} className={`item ${isOpen ? "open" : ""}`}>
            <button className="q" onClick={() => setOpenI(isOpen ? null : i)}>
              {f.q}
              <Plus className="ic" size={22} />
            </button>
            <motion.div
              className="a"
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p>{f.a}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
