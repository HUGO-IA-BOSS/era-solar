// Contenido y constantes de la landing v2

export const WA_NUMBER = "56912345678"; // TODO: reemplazar por el número real
export const EMAIL = "contacto@erasolar.cl";

export const COMUNAS = [
  "Antofagasta", "Arica", "Buin", "Calera de Tango", "Colina", "Concepción",
  "Conchalí", "El Bosque", "El Monte", "Estación Central", "Huechuraba",
  "Independencia", "Isla de Maipo", "La Cisterna", "La Florida", "La Granja",
  "La Pintana", "La Reina", "Lampa", "Las Condes", "Lo Barnechea", "Lo Espejo",
  "Lo Prado", "Macul", "Maipú", "Melipilla", "Ñuñoa", "Padre Hurtado",
  "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén", "Providencia", "Pudahuel",
  "Puerto Montt", "Puente Alto", "Quilicura", "Quilpué", "Quinta Normal",
  "Rancagua", "Recoleta", "San Bernardo", "San Joaquín", "San Miguel",
  "San Ramón", "Santiago Centro", "Talagante", "Temuco", "Tiltil", "Valparaíso",
  "Villa Alemana", "Viña del Mar", "Vitacura",
].sort();

export const TIPOS = [
  { key: "casa", label: "Casa" },
  { key: "departamento", label: "Departamento" },
  { key: "comercio", label: "Comercio" },
  { key: "industria", label: "Industria" },
  { key: "agricola", label: "Agrícola" },
  { key: "otro", label: "Otro" },
];

export const BRANDS = [
  "Trina Solar", "JA Solar", "Huawei FusionSolar", "Canadian Solar",
  "Growatt", "Longi", "SEC certificado", "Fronius",
];

export const SOLUTIONS = [
  {
    tag: "Residencial",
    title: "Tu hogar, tu propia energía",
    desc: "Sistemas a medida para casas y departamentos. Reduce tu boleta desde el primer mes con net billing.",
    img: "https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=900&q=80",
  },
  {
    tag: "Comercial",
    title: "Energía que escala con tu negocio",
    desc: "Optimiza los costos energéticos de oficinas, locales y centros comerciales con retorno medible.",
    img: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900&q=80",
  },
  {
    tag: "Industrial & agrícola",
    title: "Máximo ahorro a escala",
    desc: "Grandes instalaciones para bodegas, fábricas y campos. Ingeniería de potencia y eficiencia.",
    img: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=900&q=80",
  },
];

export const STEPS = [
  { n: "01", t: "Consultoría gratuita", d: "Evaluamos tu consumo, propiedad y ubicación para diseñar la solución ideal." },
  { n: "02", t: "Diseño con ingeniería", d: "Modelamos tu techo en 3D y dimensionamos el sistema óptimo para tu consumo." },
  { n: "03", t: "Instalación en 4 días", d: "Equipo certificado SEC ejecuta todo, incluidos los trámites con la distribuidora." },
  { n: "04", t: "Monitoreo y ahorro", d: "Ves tu generación y ahorro en tiempo real desde la app, todos los días." },
];

export const TESTIMONIALS = [
  {
    quote: "Mi cuenta pasó de $180.000 a menos de $20.000. La instalación fue impecable y en 3 días estábamos generando.",
    name: "Carolina Méndez",
    role: "Casa · Las Condes",
    ph: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    quote: "Para nuestro local el retorno fue mejor de lo proyectado. El equipo se hizo cargo de todos los trámites SEC.",
    name: "Rodrigo Fuentes",
    role: "Comercio · Providencia",
    ph: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    quote: "El monitoreo 24/7 me da una tranquilidad enorme. Veo cuánto genero y ahorro desde el celular cada día.",
    name: "Javiera Soto",
    role: "Casa · Viña del Mar",
    ph: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
];

export const FAQS = [
  {
    q: "¿Cuánto puedo ahorrar realmente?",
    a: "Depende de tu consumo, ubicación y orientación del techo, pero la mayoría de nuestros clientes reduce entre un 70% y un 100% de su cuenta de luz. Con la calculadora de esta página obtienes una estimación inmediata.",
  },
  {
    q: "¿Cuánto demora la instalación?",
    a: "En proyectos residenciales típicos, la instalación física toma menos de 4 días. Los trámites de conexión con la distribuidora bajo la Ley de Net Billing los gestionamos nosotros de principio a fin.",
  },
  {
    q: "¿Qué pasa los días nublados o de noche?",
    a: "Tu hogar sigue conectado a la red. Cuando generas más de lo que consumes, inyectas el excedente y se descuenta de tu boleta (net billing). De noche o con poco sol, consumes de la red normalmente.",
  },
  {
    q: "¿Tiene garantía?",
    a: "Sí. Paneles Tier 1 con hasta 25 años de garantía de rendimiento del fabricante, inversores con garantía de fábrica y 10 años de garantía sobre nuestra instalación, con mantención correctiva gratuita el primer año.",
  },
  {
    q: "¿Hay opciones de financiamiento?",
    a: "Sí. Trabajamos con alternativas de financiamiento para que comiences a ahorrar sin un desembolso inicial alto. Lo revisamos contigo en la consultoría gratuita.",
  },
];
