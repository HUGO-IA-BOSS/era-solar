'use client';
import { useState, useEffect } from 'react';
import {
  Sun, Shield, Smartphone, Zap, Leaf, ChevronRight,
  X, Phone, Mail, CheckCircle2,
} from 'lucide-react';

const COMUNAS = [
  'Antofagasta','Arica','Buin','Calera de Tango','Colina','Concepción',
  'Conchalí','El Bosque','El Monte','Estación Central','Huechuraba',
  'Independencia','Isla de Maipo','La Cisterna','La Florida','La Granja',
  'La Pintana','La Reina','Lampa','Las Condes','Lo Barnechea','Lo Espejo',
  'Lo Prado','Macul','Maipú','Melipilla','Ñuñoa','Padre Hurtado',
  'Pedro Aguirre Cerda','Peñaflor','Peñalolén','Providencia','Pudahuel',
  'Puerto Montt','Puente Alto','Quilicura','Quilpué','Quinta Normal',
  'Rancagua','Recoleta','San Bernardo','San Joaquín','San Miguel',
  'San Ramón','Santiago Centro','Talagante','Temuco','Tiltil','Valparaíso',
  'Villa Alemana','Viña del Mar','Vitacura',
].sort();

const AMBER = '#f59e0b';
const DARK  = '#0f172a';
const MID   = '#64748b';

const labelSt: React.CSSProperties = {
  display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:6,
};
const inputSt: React.CSSProperties = {
  width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8,
  padding:'10px 12px', fontSize:14, color:'#111827',
  outline:'none', background:'#fff', boxSizing:'border-box',
};

export default function Home() {
  const [navSolid, setNavSolid]   = useState(false);
  const [navHover, setNavHover]   = useState(false);
  const [open, setOpen]           = useState(false);
  const [done, setDone]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm] = useState({
    nombre:'', apellido:'', correo:'', numero:'',
    empresa:'', direccion:'', comuna:'', consumo:'', tipo:'', mensaje:'',
  });

  useEffect(() => {
    const onScroll = () => setNavSolid(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const change = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setDone(true);
  };

  const openForm  = () => { setOpen(true); setDone(false); };
  const closeForm = () => setOpen(false);

  const showNav = navSolid || navHover;

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', color:DARK }}>

      {/* ── MODAL ── */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) closeForm(); }}
          style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
            zIndex:1000, overflowY:'auto',
            display:'flex', alignItems:'flex-start', justifyContent:'center',
            padding:'40px 20px',
          }}
        >
          <div style={{
            background:'#fff', borderRadius:16, padding:'40px',
            maxWidth:580, width:'100%', position:'relative',
            boxShadow:'0 24px 60px rgba(0,0,0,0.3)',
          }}>
            <button onClick={closeForm} style={{
              position:'absolute', top:16, right:16, background:'none', border:'none',
              cursor:'pointer', color:'#94a3b8', display:'flex', padding:4,
            }}>
              <X size={20} />
            </button>

            {done ? (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <CheckCircle2 size={52} color={AMBER} style={{ margin:'0 auto 20px', display:'block' }} />
                <h2 style={{ fontSize:24, fontWeight:700, marginBottom:12 }}>¡Gracias!</h2>
                <p style={{ color:MID, fontSize:16, lineHeight:1.6, maxWidth:340, margin:'0 auto 28px' }}>
                  Recibimos tu consulta. Un especialista te contactará en menos de 24 horas.
                </p>
                <button onClick={closeForm} style={{
                  background:AMBER, color:'#fff', border:'none',
                  borderRadius:8, padding:'12px 32px', fontSize:16, fontWeight:700, cursor:'pointer',
                }}>Cerrar</button>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>Consultoría gratuita</h2>
                <p style={{ color:MID, fontSize:14, marginBottom:28 }}>
                  Un especialista te contactará en menos de 24 horas.
                </p>
                <form onSubmit={submit}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={labelSt}>Nombre *</label>
                      <input style={inputSt} name="nombre" required value={form.nombre} onChange={change} placeholder="Juan" /></div>
                    <div><label style={labelSt}>Apellido *</label>
                      <input style={inputSt} name="apellido" required value={form.apellido} onChange={change} placeholder="Pérez" /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={labelSt}>Correo *</label>
                      <input style={inputSt} type="email" name="correo" required value={form.correo} onChange={change} placeholder="juan@correo.com" /></div>
                    <div><label style={labelSt}>Teléfono *</label>
                      <input style={inputSt} type="tel" name="numero" required value={form.numero} onChange={change} placeholder="+56 9 1234 5678" /></div>
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={labelSt}>Empresa <span style={{ color:'#94a3b8', fontWeight:400 }}>(opcional)</span></label>
                    <input style={inputSt} name="empresa" value={form.empresa} onChange={change} placeholder="Mi Empresa SpA" />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={labelSt}>Dirección *</label>
                      <input style={inputSt} name="direccion" required value={form.direccion} onChange={change} placeholder="Av. Ejemplo 123" /></div>
                    <div><label style={labelSt}>Comuna *</label>
                      <select style={inputSt} name="comuna" required value={form.comuna} onChange={change}>
                        <option value="">Selecciona...</option>
                        {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div><label style={labelSt}>Consumo mensual aprox. *</label>
                      <input style={inputSt} name="consumo" required value={form.consumo} onChange={change} placeholder="$50.000 o 300 kWh" /></div>
                    <div><label style={labelSt}>Tipo de instalación *</label>
                      <select style={inputSt} name="tipo" required value={form.tipo} onChange={change}>
                        <option value="">Selecciona...</option>
                        <option value="casa">Casa / Residencial</option>
                        <option value="departamento">Departamento</option>
                        <option value="comercio">Comercio / Oficina</option>
                        <option value="industria">Industria / Bodega</option>
                        <option value="agricola">Agrícola</option>
                        <option value="otro">Otro</option>
                      </select></div>
                  </div>
                  <div style={{ marginBottom:24 }}>
                    <label style={labelSt}>Mensaje <span style={{ color:'#94a3b8', fontWeight:400 }}>(opcional)</span></label>
                    <textarea style={{ ...inputSt, resize:'vertical' }} name="mensaje" rows={3}
                      value={form.mensaje} onChange={change} placeholder="Cuéntanos más sobre tu proyecto..." />
                  </div>
                  <button type="submit" disabled={loading} style={{
                    width:'100%', background: loading ? '#fcd34d' : AMBER,
                    color:'#fff', border:'none', borderRadius:8,
                    padding:'14px', fontSize:16, fontWeight:700,
                    cursor: loading ? 'default' : 'pointer',
                  }}>
                    {loading ? 'Enviando...' : 'Solicitar consultoría gratuita →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav
        onMouseEnter={() => setNavHover(true)}
        onMouseLeave={() => setNavHover(false)}
        style={{
          position:'fixed', top:0, left:0, right:0, zIndex:100,
          padding:'0 48px', height:68,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background: showNav ? 'rgba(15,23,42,0.97)' : 'transparent',
          backdropFilter: showNav ? 'blur(12px)' : 'none',
          borderBottom: showNav ? '1px solid rgba(255,255,255,0.07)' : 'none',
          transition:'background 0.25s, backdrop-filter 0.25s, border-color 0.25s',
        }}
      >
        <span style={{ color:'#fff', fontSize:22, fontWeight:800, letterSpacing:'-0.5px' }}>
          Era<span style={{ color:AMBER }}>Solar</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <a href="mailto:contacto@erasolar.cl" style={{
            color:'rgba(255,255,255,0.65)', fontSize:14,
            textDecoration:'none', display:'flex', alignItems:'center', gap:6,
          }}>
            <Mail size={14} />contacto@erasolar.cl
          </a>
          <button onClick={openForm} style={{
            background:AMBER, color:'#fff', border:'none',
            borderRadius:8, padding:'9px 22px',
            fontSize:14, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}>
            Consultoría gratuita <ChevronRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position:'relative', minHeight:'100vh',
        display:'flex', alignItems:'center', overflow:'hidden', background:DARK,
      }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80)',
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'blur(2px) brightness(0.28)', transform:'scale(1.05)',
        }} />
        <div style={{
          position:'relative', zIndex:1, maxWidth:1200,
          margin:'0 auto', padding:'120px 48px 80px', width:'100%',
        }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(245,158,11,0.12)',
            border:'1px solid rgba(245,158,11,0.3)',
            borderRadius:100, padding:'6px 16px', marginBottom:32,
          }}>
            <Sun size={14} color={AMBER} />
            <span style={{ color:AMBER, fontSize:13, fontWeight:600 }}>Energía solar fotovoltaica para Chile</span>
          </div>
          <h1 style={{
            fontSize:'clamp(40px,5.5vw,74px)', fontWeight:800,
            color:'#fff', lineHeight:1.08, marginBottom:24,
            maxWidth:700, letterSpacing:'-2px',
          }}>
            Ahorra hasta 100% en tu cuenta de luz
          </h1>
          <p style={{
            fontSize:20, color:'rgba(255,255,255,0.65)',
            lineHeight:1.65, maxWidth:520, marginBottom:48,
          }}>
            Instalamos tu sistema solar fotovoltaico y empiezas a ahorrar
            desde el primer mes. Sin complicaciones, con garantía de 10 años.
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <button onClick={openForm} style={{
              background:AMBER, color:'#fff', border:'none',
              borderRadius:10, padding:'16px 32px',
              fontSize:16, fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
            }}>
              Consultoría gratuita <ChevronRight size={17} />
            </button>
            <button onClick={openForm} style={{
              background:'transparent', color:'#fff',
              border:'1.5px solid rgba(255,255,255,0.28)',
              borderRadius:10, padding:'16px 32px',
              fontSize:16, fontWeight:600, cursor:'pointer',
            }}>
              Calcular mi ahorro
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background:AMBER, padding:'44px 48px' }}>
        <div style={{
          maxWidth:1200, margin:'0 auto',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:32, textAlign:'center',
        }}>
          {[
            { v:'+1.000', l:'Paneles instalados' },
            { v:'< 4 días', l:'Tiempo de instalación' },
            { v:'10 años', l:'Garantía de paneles' },
          ].map(s => (
            <div key={s.v}>
              <div style={{ fontSize:34, fontWeight:800, color:'#fff' }}>{s.v}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.82)', marginTop:4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section style={{ background:'#f8fafc', padding:'96px 48px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-1px', marginBottom:14 }}>
              Soluciones para cada necesidad
            </h2>
            <p style={{ color:MID, fontSize:18, maxWidth:500, margin:'0 auto' }}>
              Diseñamos e instalamos sistemas solares a medida para hogares, comercios e industrias.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {[
              {
                img:'https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=700&q=80',
                title:'Residencial',
                desc:'Paneles para tu hogar. Reduce tu boleta desde el primer mes con sistemas diseñados para casas y departamentos.',
              },
              {
                img:'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=700&q=80',
                title:'Comercial',
                desc:'Optimiza los costos energéticos de tu negocio. Soluciones escalables para oficinas, locales y centros comerciales.',
              },
              {
                img:'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=700&q=80',
                title:'Industrial',
                desc:'Grandes instalaciones para bodegas, fábricas y proyectos agrícolas. Máximo ahorro a escala industrial.',
              },
            ].map(s => (
              <div key={s.title} onClick={openForm} style={{
                borderRadius:16, overflow:'hidden', background:'#fff',
                boxShadow:'0 1px 4px rgba(0,0,0,0.07)', cursor:'pointer',
              }}>
                <div style={{
                  height:210,
                  backgroundImage:`url(${s.img})`,
                  backgroundSize:'cover', backgroundPosition:'center',
                }} />
                <div style={{ padding:28 }}>
                  <h3 style={{ fontSize:20, fontWeight:700, marginBottom:8 }}>{s.title}</h3>
                  <p style={{ color:MID, lineHeight:1.65, fontSize:15, marginBottom:18 }}>{s.desc}</p>
                  <span style={{
                    color:AMBER, fontWeight:700, fontSize:14,
                    display:'flex', alignItems:'center', gap:4,
                  }}>
                    Consultar <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section style={{ background:'#fff', padding:'96px 48px' }}>
        <div style={{
          maxWidth:1200, margin:'0 auto',
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:96, alignItems:'center',
        }}>
          <div>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-1px', marginBottom:16 }}>
              ¿Por qué elegir EraSolar?
            </h2>
            <p style={{ color:MID, fontSize:18, lineHeight:1.65, marginBottom:44 }}>
              Más de 10 años instalando sistemas fotovoltaicos en Chile, con foco en calidad,
              garantía real y acompañamiento total.
            </p>
            {[
              { icon:<Sun size={20} color={AMBER} />,       t:'Paneles Tier 1 de alta eficiencia',   d:'Monocristalinos 400W–600W con hasta 22% de eficiencia. Tecnología de primer nivel.' },
              { icon:<Shield size={20} color={AMBER} />,    t:'Garantía de 10 años',                  d:'Instalación garantizada con mantención correctiva gratuita durante el primer año.' },
              { icon:<Smartphone size={20} color={AMBER} />,t:'Monitoreo en tiempo real 24/7',         d:'App que muestra tu generación y ahorro energético en todo momento.' },
              { icon:<Zap size={20} color={AMBER} />,       t:'Instalación en menos de 4 días',        d:'Equipo certificado que ejecuta todo: diseño, instalación y conexión a la red.' },
            ].map(b => (
              <div key={b.t} style={{ display:'flex', gap:16, marginBottom:24 }}>
                <div style={{
                  width:44, height:44, background:'#fef3c7', borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                }}>{b.icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:3 }}>{b.t}</div>
                  <div style={{ color:MID, fontSize:14, lineHeight:1.55 }}>{b.d}</div>
                </div>
              </div>
            ))}
            <button onClick={openForm} style={{
              marginTop:8, background:DARK, color:'#fff', border:'none',
              borderRadius:10, padding:'14px 28px',
              fontSize:15, fontWeight:700, cursor:'pointer',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
              Solicitar evaluación gratuita <ChevronRight size={16} />
            </button>
          </div>
          <div style={{
            borderRadius:20, overflow:'hidden', height:540,
            backgroundImage:'url(https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&q=80)',
            backgroundSize:'cover', backgroundPosition:'center',
          }} />
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section style={{ background:'#f8fafc', padding:'96px 48px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:72 }}>
            <h2 style={{ fontSize:42, fontWeight:800, letterSpacing:'-1px', marginBottom:14 }}>
              Cómo funciona
            </h2>
            <p style={{ color:MID, fontSize:18, maxWidth:460, margin:'0 auto' }}>
              De la consulta a tu primer kWh solar en 4 pasos simples.
            </p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:32 }}>
            {[
              { n:'01', t:'Consultoría gratuita', d:'Evaluamos tu consumo, propiedad y ubicación para diseñar la solución ideal.' },
              { n:'02', t:'Diseño personalizado', d:'Nuestros ingenieros diseñan el sistema solar optimizado para tu techo y consumo.' },
              { n:'03', t:'Instalación en 4 días', d:'Equipo certificado realiza la instalación completa, incluidos los trámites con la distribuidora.' },
              { n:'04', t:'Monitoreo y ahorro', d:'Desde el primer día ves tu generación y el ahorro en tu boleta de electricidad.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign:'center' }}>
                <div style={{
                  width:56, height:56, background:AMBER, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 20px', fontSize:17, fontWeight:800, color:'#fff',
                }}>{s.n}</div>
                <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{s.t}</h3>
                <p style={{ color:MID, fontSize:14, lineHeight:1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{
        position:'relative', overflow:'hidden',
        padding:'120px 48px', textAlign:'center', background:DARK,
      }}>
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:'url(https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80)',
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'blur(4px) brightness(0.15)', transform:'scale(1.05)',
        }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <h2 style={{
            fontSize:'clamp(34px,5vw,54px)', fontWeight:800,
            color:'#fff', letterSpacing:'-1.5px', marginBottom:16,
          }}>
            Empieza a ahorrar hoy
          </h2>
          <p style={{
            color:'rgba(255,255,255,0.6)', fontSize:19,
            maxWidth:460, margin:'0 auto 48px', lineHeight:1.6,
          }}>
            Solicita tu consultoría gratuita y descubre cuánto puedes ahorrar con energía solar.
          </p>
          <button onClick={openForm} style={{
            background:AMBER, color:'#fff', border:'none',
            borderRadius:10, padding:'18px 44px',
            fontSize:17, fontWeight:700, cursor:'pointer',
            display:'inline-flex', alignItems:'center', gap:8,
          }}>
            Consultoría gratuita <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#080d1a', padding:'48px 48px' }}>
        <div style={{
          maxWidth:1200, margin:'0 auto',
          display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:16,
        }}>
          <span style={{ color:'#fff', fontSize:20, fontWeight:800 }}>
            Era<span style={{ color:AMBER }}>Solar</span>
          </span>
          <div style={{ display:'flex', gap:28, fontSize:13, color:'rgba(255,255,255,0.4)', flexWrap:'wrap', alignItems:'center' }}>
            <span>© 2025 EraSolar SpA</span>
            <a href="mailto:contacto@erasolar.cl" style={{
              color:'rgba(255,255,255,0.4)', textDecoration:'none',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <Mail size={13} /> contacto@erasolar.cl
            </a>
            <a href="tel:+56912345678" style={{
              color:'rgba(255,255,255,0.4)', textDecoration:'none',
              display:'flex', alignItems:'center', gap:6,
            }}>
              <Phone size={13} /> +56 9 XXXX XXXX
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
