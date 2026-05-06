'use client';

import { useState, useEffect } from 'react';
import { type Idioma } from '@/lib/i18n';
import IdiomaSelector from '@/components/IdiomaSelector';
import {
  Presentation,
  Users,
  FolderOpen,
  UserPlus,
  CheckCircle,
  CircleAlert,
  User,
  Globe,
  PartyPopper,
  MessageSquare,
  Star,
  Sprout,
  Handshake,
  Save,
  Plus,
  LogOut,
  GraduationCap,
  BookOpen,
  Pencil,
  Clock,
  LayoutDashboard,
  Trash2,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  Send,
  LineChart,
  Activity,
  Mic,
  Gamepad2
} from 'lucide-react';

type Estudiante = {
  id: string;
  nombre: string;
  usuario: string;
  rol: string;
  grado: number;
  idioma: string;
  activo: boolean;
  padrinoId: string | null;
  padrino: { nombre: string } | null;
  progresos: { momento: string; completado: boolean; tema: { nombre: string; slug: string } }[];
};

type Produccion = {
  id: string;
  userId: string;
  userNombre: string;
  temaNombre: string;
  tipo: string;
  urlArchivo: string | null;
  reflexion: string | null;
  autoEval: string | null;
  feedbackMaestro: string | null;
  feedbackPadrino: string | null;
  createdAt: string;
};

type ForoComentario = {
  id: string;
  userId: string;
  temaId: string;
  userNombre: string;
  temaNombre: string;
  contenido: string;
  tipo: string;
  urlAudio: string | null;
  createdAt: string;
  respuestas: {
    id: string;
    userNombre: string;
    contenido: string;
    createdAt: string;
  }[];
};

type Padrino = { id: string; nombre: string };
type Tema = { id: string; nombre: string; grado: number };

type Recurso = {
  tipo: string;
  url: string;
  nombre: string;
};

type Contenido = {
  id: string;
  temaId: string;
  momento: string;
  idioma: string;
  titulo: string;
  descripcion: string | null;
  textoPreguntaForo: string | null;
  requiereEntrega: boolean;
  tipoActividad: string;
  tipoJuego?: string | null;
  recursos?: Recurso[];
  urlAudioInstruccion?: string | null;
};

type Props = {
  maestroNombre: string;
  estudiantes: any[];
  padrinos: Padrino[];
  todasProducciones: Produccion[];
  temas: Tema[];
  contenidos: Contenido[];
  comentariosForo: ForoComentario[];
  idioma: Idioma;
};

type Tab = 'estudiantes' | 'seguimiento' | 'portafolios' | 'valoracion' | 'tareas' | 'nuevo' | 'evaluacion';

const MOMENTO_ICON: Record<string, any> = {
  PRACTICA: Sprout,
  TEORIA: BookOpen,
  VALORACION: Handshake,
  PRODUCCION: Pencil,
};
const IDIOMA_LABEL: Record<string, string> = { es: 'Español', ay: 'Aymara', qu: 'Quechua', gu: 'Guaraní' };

const FEEDBACK_OPTIONS = [
  { value: 'Excelente trabajo, lo lograste completamente', label: 'Excelente', icon: Star, color: '#fbbf24' },
  { value: 'Buen trabajo, vas por el buen camino', label: 'En camino', icon: Sprout, color: '#10b981' },
  { value: 'Puedes mejorar, ¡sigue intentando!', label: 'Necesita esfuerzo', icon: Handshake, color: '#6366f1' },
];

export default function MaestroClient({
  maestroNombre,
  estudiantes,
  padrinos,
  todasProducciones,
  temas,
  contenidos: initialContenidos,
  comentariosForo: initialForo,
  idioma
}: Props) {
  const [tab, setTab] = useState<Tab>('estudiantes');
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [asignaciones, setAsignaciones] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [contenidos, setContenidos] = useState<Contenido[]>(initialContenidos);
  const [foro, setForo] = useState<ForoComentario[]>(initialForo);

  // Nuevo usuario form
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [nuevoPin, setNuevoPin] = useState('');
  const [nuevoRol, setNuevoRol] = useState('ESTUDIANTE');
  const [nuevoGrado, setNuevoGrado] = useState(3);
  const [nuevoIdioma, setNuevoIdioma] = useState('es');
  const [nuevoPadrino, setNuevoPadrino] = useState('');
  const [creando, setCreando] = useState(false);

  async function guardarFeedback(produccionId: string) {
    const fb = feedbacks[produccionId];
    if (!fb) return;
    setGuardando((g) => ({ ...g, [produccionId]: true }));
    try {
      await fetch('/api/produccion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produccionId, feedbackMaestro: fb }),
      });
      setExito('Retroalimentación guardada');
      setTimeout(() => setExito(''), 3000);
    } catch {
      setError('Error al guardar');
    } finally {
      setGuardando((g) => ({ ...g, [produccionId]: false }));
    }
  }

  async function asignarPadrino(estudianteId: string) {
    const padrinoId = asignaciones[estudianteId];
    setGuardando((g) => ({ ...g, [estudianteId]: true }));
    try {
      await fetch('/api/maestro/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: estudianteId, padrinoId }),
      });
      setExito('Padrino asignado');
      setTimeout(() => setExito(''), 3000);
    } catch {
      setError('Error al asignar');
    } finally {
      setGuardando((g) => ({ ...g, [estudianteId]: false }));
    }
  }

  return (
    <div className="maestro-page p-6 max-w-7xl mx-auto">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex-center anim-flotar">
            <GraduationCap size={40} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Panel del Maestro</h1>
            <p className="text-slate-500 font-medium">Bienvenida, {maestroNombre}!</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white px-6 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Clock size={18} className="text-brand-primary" />
            <span className="font-bold text-slate-700">{new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
          <a href="/api/auth/logout" className="btn-burbuja btn--secundario py-2 px-6">
            <LogOut size={20} /> Salir
          </a>
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Estudiantes', val: estudiantes.length, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
          { label: 'Padrinos', val: padrinos.length, icon: UserPlus, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
          { label: 'Pendientes', val: todasProducciones.filter(p => !p.feedbackMaestro).length, icon: Pencil, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
          { label: 'Foro Activo', val: foro.length, icon: MessageCircle, color: 'text-brand-info', bg: 'bg-brand-info/10' },
        ].map((s, i) => (
          <div key={i} className="card p-6 flex items-center gap-6">
            <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex-center`}>
              <s.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{s.val}</div>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <nav className="card p-2 mb-8 flex flex-wrap gap-2 bg-white/50 backdrop-blur-xl border-white/20">
        {[
          { id: 'estudiantes', labelKey: 'maestro_tab_alumnos', label: 'Mis Alumnos', icon: Users, color: 'text-brand-primary' },
          { id: 'seguimiento', labelKey: 'maestro_tab_seguimiento', label: 'Seguimiento', icon: LineChart, color: 'text-brand-info' },
          { id: 'portafolios', labelKey: 'maestro_tab_revisar', label: 'Revisar Tareas', icon: FolderOpen, color: 'text-brand-accent' },
          { id: 'valoracion', labelKey: 'maestro_tab_muro', label: 'Foro', icon: MessageCircle, color: 'text-brand-info' },
          { id: 'tareas', labelKey: 'maestro_tab_config', label: 'Configurar', icon: LayoutDashboard, color: 'text-brand-success' },
          { id: 'nuevo', labelKey: 'maestro_tab_nuevo', label: 'Registrar', icon: Plus, color: 'text-slate-400' },
          { id: 'evaluacion', labelKey: 'maestro_tab_evaluacion', label: 'Evaluación', icon: Gamepad2, color: 'text-purple-500' },
        ].map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id as Tab)}
            className={`flex-1 min-w-[150px] btn-burbuja py-3 gap-3 ${tab === tabItem.id ? 'btn--primario' : 'bg-white/80 text-slate-500 shadow-sm hover:bg-white'}`}
          >
            <tabItem.icon size={20} className={tab === tabItem.id ? 'text-white' : tabItem.color} />
            <span className="font-bold">{tabItem.label}</span>
          </button>
        ))}
      </nav>

      {/* Notifications */}
      {exito && <div className="anim-fadeInUp fixed bottom-8 right-8 z-50 bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"><CheckCircle /> {exito}</div>}
      {error && <div className="anim-fadeInUp fixed bottom-8 right-8 z-50 bg-rose-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"><CircleAlert /> {error}</div>}

      {/* Main Content Area */}
      <main className="anim-fadeInUp">
        {tab === 'estudiantes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {estudiantes.map(est => (
              <div key={est.id} className="card p-6 border-t-8 border-t-brand-primary/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{est.nombre}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-lg">@{est.usuario}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>Grado {est.grado}º</span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${est.activo ? 'bg-emerald-400' : 'bg-slate-300'} shadow-sm`}></div>
                </div>

                <div className="flex gap-2 mb-6">
                  {['PRACTICA', 'TEORIA', 'VALORACION', 'PRODUCCION'].map(m => {
                    const p = est.progresos.find((pr: any) => pr.momento === m);
                    const Icon = MOMENTO_ICON[m];
                    return (
                      <div key={m} className={`flex-1 aspect-square rounded-2xl flex-center transition-all ${p?.completado ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-50 text-slate-300 border-2 border-dashed border-slate-100'}`} title={m}>
                        <Icon size={20} />
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="form-label">Tutor asignado</label>
                  <div className="flex gap-2">
                    <select
                      className="form-select text-sm py-2"
                      value={asignaciones[est.id] || est.padrinoId || ''}
                      onChange={(e) => setAsignaciones(a => ({ ...a, [est.id]: e.target.value }))}
                    >
                      <option value="">Sin padrino</option>
                      {padrinos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <button onClick={() => asignarPadrino(est.id)} className="btn-burbuja btn--primario p-2 rounded-2xl shadow-sm">
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'seguimiento' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <LineChart size={32} className="text-brand-info" /> Avance de Estudiantes
              </h2>
              <div className="badge bg-brand-info/10 text-brand-info font-black">Ciclo Lectivo 2024</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estudiantes.map(est => {
                const totalCompletado = est.progresos.filter((p: any) => p.completado).length;
                const totalPosible = temas.length * 4;
                const porcentaje = totalPosible > 0 ? Math.round((totalCompletado / totalPosible) * 100) : 0;

                return (
                  <div key={est.id} className="card p-6 border-b-8 border-b-slate-100 hover:border-b-brand-info transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex-center text-slate-400 font-black group-hover:bg-brand-info group-hover:text-white transition-colors">
                          {est.nombre[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{est.nombre}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{est.grado}º Grado • {IDIOMA_LABEL[est.idioma]}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm ${est.status === 'logrado' ? 'bg-amber-400 text-white' :
                        est.status === 'proceso' ? 'bg-emerald-400 text-white' :
                          est.status === 'ayuda' ? 'bg-rose-500 text-white animate-pulse' :
                            'bg-slate-100 text-slate-400'
                        }`}>
                        {est.status === 'ayuda' ? '⚠️ NECESITA AYUDA' : est.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Progreso Total</span>
                        <span>{porcentaje}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-info transition-all duration-1000"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-2">
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 font-black uppercase">Temas</p>
                          <p className="font-bold text-slate-700">{temas.length}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl text-center">
                          <p className="text-[10px] text-slate-400 font-black uppercase">Tareas</p>
                          <p className="font-bold text-slate-700">{est.revisado ? 'Al día' : 'Pendiente'}</p>
                        </div>
                      </div>

                      <button onClick={() => setTab('portafolios')} className="w-full mt-2 py-3 text-xs font-black uppercase tracking-widest text-brand-info hover:bg-brand-info/5 rounded-xl transition-colors flex items-center justify-center gap-2">
                        Ver Detalles <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'portafolios' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <FolderOpen size={32} className="text-brand-accent" /> Revisión de Trabajos
              </h2>
              <div className="flex gap-2">
                <span className="badge bg-rose-100 text-rose-600 font-bold">Pendientes: {todasProducciones.filter(p => !p.feedbackMaestro).length}</span>
                <span className="badge bg-emerald-100 text-emerald-600 font-bold">Revisados: {todasProducciones.filter(p => !!p.feedbackMaestro).length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {todasProducciones.length === 0 ? (
                <div className="col-span-full p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase tracking-widest">No hay tareas entregadas todavía</p>
                </div>
              ) : (
                todasProducciones.map((prod) => (
                  <div key={prod.id} className={`card overflow-hidden border-2 transition-all ${prod.feedbackMaestro ? 'border-emerald-100 opacity-80' : 'border-brand-primary/20 shadow-xl shadow-brand-primary/5'}`}>
                    <div className={`${prod.feedbackMaestro ? 'bg-emerald-500' : 'bg-brand-primary'} p-4 text-white flex justify-between items-center`}>
                      <span className="font-black text-sm uppercase tracking-tighter">{prod.temaNombre}</span>
                      <span className="text-[10px] font-bold opacity-80">{new Date(prod.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex-center text-slate-400 font-black">
                          {prod.userNombre[0]}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{prod.userNombre}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1 font-bold">
                            TIPO: {prod.tipo.toUpperCase()}
                          </p>
                        </div>
                        {prod.autoEval && (
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${prod.autoEval === 'logrado' ? 'bg-amber-100 text-amber-600' :
                            prod.autoEval === 'proceso' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-rose-100 text-rose-600'
                            }`}>
                            Siente: {prod.autoEval}
                          </div>
                        )}
                      </div>

                      {prod.reflexion && (
                        <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 italic text-slate-600 text-sm">
                          "{prod.reflexion}"
                        </div>
                      )}

                      {prod.urlArchivo && (
                        <div className="mb-6">
                          <a href={prod.urlArchivo} target="_blank" rel="noopener noreferrer" className="btn-burbuja btn--secundario w-full text-xs py-3 flex items-center justify-center gap-2">
                            Ver archivo entregado <ExternalLink size={14} />
                          </a>
                        </div>
                      )}

                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                          {prod.feedbackMaestro ? 'Evaluación enviada' : 'Escribir Retroalimentación'}
                        </label>
                        <textarea
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-brand-primary outline-none text-sm"
                          rows={2}
                          placeholder="Felicita al estudiante o dale consejos..."
                          value={feedbacks[prod.id] || prod.feedbackMaestro || ''}
                          onChange={(e) => setFeedbacks({ ...feedbacks, [prod.id]: e.target.value })}
                          disabled={!!prod.feedbackMaestro}
                        />
                        {!prod.feedbackMaestro && (
                          <button
                            onClick={() => guardarFeedback(prod.id)}
                            disabled={guardando[prod.id] || !feedbacks[prod.id]}
                            className="btn-burbuja btn--primario w-full"
                          >
                            {guardando[prod.id] ? 'Guardando...' : <><Save /> Enviar evaluación</>}
                          </button>
                        )}
                        {prod.feedbackMaestro && (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 p-2 rounded-xl">
                            <CheckCircle size={16} /> Tarea revisada correctamente
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'valoracion' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-8">
              <MessageCircle size={32} className="text-brand-info" /> Muro de Valoración Comunitaria
            </h2>

            {foro.map(post => (
              <div key={post.id} className="card p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-info/10 rounded-2xl flex-center text-brand-info font-black text-xl">
                      {post.userNombre[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{post.userNombre}</h4>
                      <div className="flex gap-3 text-xs font-bold text-slate-400">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{post.temaNombre}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl mb-6 text-slate-700 text-lg leading-relaxed border border-slate-100">
                  {post.tipo === 'audio' && post.urlAudio && (
                    <audio controls src={post.urlAudio} className="mb-4 w-full" />
                  )}
                  {post.contenido}
                </div>

                {/* Respuestas existentes */}
                <div className="ml-8 space-y-4 border-l-4 border-brand-info/20 pl-8 mb-6">
                  {post.respuestas.map(resp => (
                    <div key={resp.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-brand-info">{resp.userNombre}</span>
                        <span className="text-[10px] text-slate-300">{new Date(resp.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-600">{resp.contenido}</p>
                    </div>
                  ))}
                </div>

                {/* Formulario de respuesta */}
                <div className="flex gap-4">
                  <input
                    id={`reply-${post.id}`}
                    type="text"
                    className="form-input"
                    placeholder="Escribe una respuesta para el estudiante..."
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const val = input.value;
                        if (!val.trim()) return;

                        try {
                          const res = await fetch('/api/maestro/foro', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ parentId: post.id, contenido: val, temaId: post.temaId })
                          });
                          if (res.ok) {
                            const { respuesta } = await res.json();
                            setForo(prev => prev.map(p => p.id === post.id ? { ...p, respuestas: [...p.respuestas, respuesta] } : p));
                            input.value = '';
                            setExito('Respuesta enviada');
                            setTimeout(() => setExito(''), 2000);
                          }
                        } catch { setError('Error al responder'); }
                      }
                    }}
                  />
                  <button className="btn-burbuja btn--info p-4 aspect-square">
                    <Send size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'tareas' && (
          <ContenidosManager temas={temas} contenidos={contenidos} setContenidos={setContenidos} setError={setError} setExito={setExito} />
        )}

        {tab === 'evaluacion' && (
          <EvaluacionJuegoPanel />
        )}

        {tab === 'nuevo' && (
          <div className="card p-10 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <UserPlus size={32} className="text-brand-primary" /> Crear nuevo miembro
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input className="form-input" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Ej: Mario Condori" />
                </div>
                <div className="form-group">
                  <label className="form-label">Usuario</label>
                  <input className="form-input" value={nuevoUsuario} onChange={e => setNuevoUsuario(e.target.value.toLowerCase())} placeholder="mario.c" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN de acceso</label>
                <input className="form-input" type="password" value={nuevoPin} onChange={e => setNuevoPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 dígitos" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="PADRINO">Padrino Digital</option>
                    <option value="MAESTRO">Maestro (Administrador)</option>
                    <option value="FAMILIA">Madre/Padre de familia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Grado</label>
                  <select className="form-select" value={nuevoGrado} onChange={e => setNuevoGrado(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Grado {g}</option>)}
                  </select>
                </div>
              </div>

              <button
                className="btn-burbuja btn--primario w-full mt-4"
                disabled={creando || !nuevoNombre || !nuevoUsuario || !nuevoPin}
                onClick={async () => {
                  setCreando(true);
                  try {
                    const res = await fetch('/api/maestro/usuarios', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nombre: nuevoNombre, usuario: nuevoUsuario, pin: nuevoPin, rol: nuevoRol, grado: nuevoGrado, idioma: nuevoIdioma })
                    });
                    if (res.ok) {
                      setExito('Usuario creado');
                      setNuevoNombre(''); setNuevoUsuario(''); setNuevoPin('');
                      setTimeout(() => setExito(''), 3000);
                    }
                  } catch { setError('Error al crear'); }
                  finally { setCreando(false); }
                }}
              >
                {creando ? 'Creando...' : 'Crear Usuario Ahora'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function EvaluacionJuegoPanel() {
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/evaluacion-juego', {
      headers: { 'x-usuario': 'maestra.rosa' },
    })
      .then(r => r.json())
      .then(d => {
        if (d.resultados) setResultados(d.resultados);
        else setError('No se pudieron cargar los resultados.');
      })
      .catch(() => setError('Error de conexión.'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Gamepad2 size={32} className="text-purple-500" /> Evaluación — Desafío de la Cosecha
        </h2>
        <a
          href="/evaluacion-fracciones.html"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-burbuja btn--secundario flex items-center gap-2 text-sm py-2 px-4"
        >
          <ExternalLink size={16} /> Abrir Juego
        </a>
      </div>

      <div className="card p-4 bg-purple-50 border border-purple-200 rounded-2xl text-sm text-purple-700 font-semibold">
        📋 Comparte este enlace con tus estudiantes:{' '}
        <code className="bg-white px-2 py-1 rounded-lg text-purple-800 font-mono text-xs">
          {typeof window !== 'undefined' ? window.location.origin : ''}/evaluacion-fracciones.html
        </code>
      </div>

      {cargando && (
        <div className="text-center py-20 text-slate-400 font-bold">Cargando resultados... ⏳</div>
      )}
      {error && (
        <div className="text-center py-10 text-rose-500 font-bold">{error}</div>
      )}
      {!cargando && !error && resultados.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold uppercase tracking-widest">Aún no hay resultados del juego</p>
          <p className="text-slate-400 text-sm mt-2">Los resultados aparecerán aquí cuando los estudiantes terminen el juego.</p>
        </div>
      )}
      {!cargando && resultados.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="p-4 text-left font-black">Estudiante</th>
                <th className="p-4 text-left font-black">Usuario</th>
                <th className="p-4 text-center font-black">Nota</th>
                <th className="p-4 text-center font-black">Correctas</th>
                <th className="p-4 text-center font-black">Fecha</th>
                <th className="p-4 text-center font-black">Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-4 font-bold text-slate-800">{r.estudiante}</td>
                  <td className="p-4 text-slate-500 font-mono text-xs">{r.usuario}</td>
                  <td className="p-4 text-center">
                    <span className={`font-black text-lg ${Number(r.nota) >= 80 ? 'text-emerald-600' : Number(r.nota) >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {r.nota}/100
                    </span>
                  </td>
                  <td className="p-4 text-center text-slate-600 font-semibold">{r.correctas}/{r.total}</td>
                  <td className="p-4 text-center text-slate-400 text-xs">{r.fecha}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${r.estado.includes('Aprobado') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContenidosManager({ temas, contenidos, setContenidos, setError, setExito }: {
  temas: Tema[],
  contenidos: Contenido[],
  setContenidos: any,
  setError: any,
  setExito: any
}) {
  const [selectedTema, setSelectedTema] = useState<string>(temas[0]?.id || '');
  const [selectedMomento, setSelectedMomento] = useState<string>('PRACTICA');
  const [selectedIdioma, setSelectedIdioma] = useState<string>('es');
  const [guardando, setGuardando] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [textoPreguntaForo, setTextoPreguntaForo] = useState('');
  const [requiereEntrega, setRequiereEntrega] = useState(true);
  const [tipoActividad, setTipoActividad] = useState('evidencia');
  const [tipoJuego, setTipoJuego] = useState<string>('quiz');
  const [urlAudioInstruccion, setUrlAudioInstruccion] = useState<string | null>(null);
  const [subiendoAudio, setSubiendoAudio] = useState(false);

  // Multiple Recursos State
  const [recursos, setRecursos] = useState<Recurso[]>([]);

  useEffect(() => {
    const existente = contenidos.find(c => c.temaId === selectedTema && c.momento === selectedMomento && c.idioma === selectedIdioma);
    if (existente) {
      setTitulo(existente.titulo || '');
      setDescripcion(existente.descripcion || '');
      setTextoPreguntaForo(existente.textoPreguntaForo || '');
      setRequiereEntrega(existente.requiereEntrega ?? true);
      setTipoActividad(existente.tipoActividad || 'evidencia');
      setTipoJuego(existente.tipoJuego || 'quiz');
      setRecursos(existente.recursos || []);
      setUrlAudioInstruccion(existente.urlAudioInstruccion || null);
    } else {
      setTitulo(''); setDescripcion(''); setTextoPreguntaForo(''); setRequiereEntrega(true); setTipoActividad('evidencia'); setTipoJuego('quiz'); setRecursos([]);
      setUrlAudioInstruccion(null);
    }
  }, [selectedTema, selectedMomento, selectedIdioma, contenidos]);

  async function guardar() {
    setGuardando(true);
    try {
      const res = await fetch('/api/maestro/contenidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temaId: selectedTema, momento: selectedMomento, idioma: selectedIdioma,
          titulo, descripcion, textoPreguntaForo, requiereEntrega, tipoActividad, tipoJuego, recursos, urlAudioInstruccion
        })
      });
      if (res.ok) {
        const data = await res.json();
        setContenidos((prev: any) => [...prev.filter((c: any) => c.id !== data.contenido.id), data.contenido]);
        setExito('Configuración guardada');
        setTimeout(() => setExito(''), 3000);
      }
    } catch { setError('Error al guardar'); }
    finally { setGuardando(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Selector de Configuración */}
      <div className="lg:col-span-1 space-y-6">
        <div className="card p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-primary">
            <LayoutDashboard size={24} /> Configuración
          </h3>

          <div className="space-y-4">
            <div>
              <label className="form-label">Tema</label>
              <select className="form-select" value={selectedTema} onChange={e => setSelectedTema(e.target.value)}>
                {temas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Momento Didáctico</label>
              <select className="form-select" value={selectedMomento} onChange={e => setSelectedMomento(e.target.value)}>
                <option value="PRACTICA">Práctica</option>
                <option value="TEORIA">Teoría</option>
                <option value="VALORACION">Valoración</option>
                <option value="PRODUCCION">Producción</option>
              </select>
            </div>
            <div>
              <label className="form-label">Idioma</label>
              <select className="form-select" value={selectedIdioma} onChange={e => setSelectedIdioma(e.target.value)}>
                {Object.entries(IDIOMA_LABEL).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Editor de Contenido */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-8 border-t-8 border-t-brand-primary shadow-2xl">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                {selectedMomento}: {selectedTema ? temas.find(t => t.id === selectedTema)?.nombre : ''}
              </h3>
              <p className="text-slate-400 font-bold text-sm">Configuración pedagógica del momento</p>
            </div>
            <div className="badge bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              ID: {selectedIdioma.toUpperCase()}
            </div>
          </div>

          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Título de la Actividad/Tema</label>
              <input className="form-input font-bold text-lg" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Exploramos las Fracciones" />
            </div>

            <div className="form-group">
              <label className="form-label">Instrucciones o Teoría</label>
              <textarea className="form-textarea" rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Escribe aquí el contenido principal..." />
            </div>

            {/* Audio de Instrucción */}
            <div className="form-group pt-4">
              <label className="form-label flex items-center gap-2">
                <Mic size={18} className="text-brand-primary" /> Audio de Instrucción (Opcional)
              </label>
              <div className="flex gap-4 items-center">
                {urlAudioInstruccion ? (
                  <div className="flex-1 flex items-center gap-4 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                    <audio src={urlAudioInstruccion} controls className="h-8 flex-1" />
                    <button onClick={() => setUrlAudioInstruccion(null)} className="text-rose-500 hover:text-rose-700 font-bold text-xs uppercase">Eliminar</button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSubiendoAudio(true);
                      const formData = new FormData();
                      formData.append('archivo', file);
                      formData.append('temaSlug', (temas.find((t: any) => t.id === selectedTema) as any)?.slug || 'general');
                      try {
                        const res = await fetch('/api/maestro/upload', { method: 'POST', body: formData });
                        const data = await res.json();
                        if (data.success) setUrlAudioInstruccion(data.url);
                        else setError(data.error || 'Error al subir');
                      } catch { setError('Error de red'); }
                      finally { setSubiendoAudio(false); }
                    }}
                    className="form-input text-xs"
                  />
                )}
                {subiendoAudio && <span className="text-xs text-brand-primary animate-pulse font-bold">Subiendo...</span>}
              </div>
            </div>

            {/* Gestión de Recursos Múltiples */}
            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                Materiales y Recursos
                <button
                  onClick={() => setRecursos([...recursos, { tipo: 'video', url: '', nombre: '' }])}
                  className="text-brand-primary text-sm flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Agregar recurso
                </button>
              </h4>

              <div className="space-y-4">
                {recursos.map((rec, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-32">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tipo</label>
                      <select
                        className="form-select py-1 px-3 text-sm"
                        value={rec.tipo}
                        onChange={(e) => {
                          const n = [...recursos];
                          n[idx].tipo = e.target.value;
                          setRecursos(n);
                        }}
                      >
                        <option value="video">Video</option>
                        <option value="documento">Doc/PDF</option>
                        <option value="imagen">Imagen</option>
                        <option value="juego">Juego</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</label>
                      <input
                        className="form-input py-1 px-3 text-sm"
                        value={rec.nombre}
                        onChange={e => {
                          const n = [...recursos];
                          n[idx].nombre = e.target.value;
                          setRecursos(n);
                        }}
                        placeholder="Nombre del archivo"
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">URL / Link</label>
                      <input
                        className="form-input py-1 px-3 text-sm"
                        value={rec.url}
                        onChange={e => {
                          const n = [...recursos];
                          n[idx].url = e.target.value;
                          setRecursos(n);
                        }}
                        placeholder="https://..."
                      />
                    </div>
                    <button
                      onClick={() => setRecursos(recursos.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {recursos.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No has agregado materiales extra aún.</p>}
              </div>
            </div>

            {selectedMomento === 'VALORACION' && (
              <div className="form-group pt-6 border-t border-slate-100">
                <label className="form-label">Pregunta para el Foro Comunitario</label>
                <textarea className="form-textarea" rows={2} value={textoPreguntaForo} onChange={e => setTextoPreguntaForo(e.target.value)} placeholder="Ej: ¿Cómo compartirías una manzana con tus amigos?" />
              </div>
            )}

            {(selectedMomento === 'PRACTICA' || selectedMomento === 'PRODUCCION') && (
              <div className="space-y-4">
                <div className="bg-brand-primary/5 p-6 rounded-3xl border-2 border-brand-primary/10">
                  <label className="form-label text-brand-primary">Tipo de Interacción del Estudiante</label>
                  <select className="form-select font-bold" value={tipoActividad} onChange={e => {
                    setTipoActividad(e.target.value);
                    setRequiereEntrega(e.target.value === 'evidencia');
                  }}>
                    <option value="evidencia">Requiere Evidencia (Foto/Audio)</option>
                    <option value="juego">Actividad Interactiva (Juego)</option>
                    <option value="lectura">Solo Lectura / Revisión</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-3 font-medium">
                    {tipoActividad === 'evidencia' ? '💡 El alumno deberá subir un archivo para completar la tarea.' : '💡 El sistema marcará la tarea como completada automáticamente al terminar la interacción.'}
                  </p>
                </div>

                {tipoActividad === 'juego' && (
                  <div className="bg-brand-accent/5 p-6 rounded-3xl border-2 border-brand-accent/10 anim-fadeInUp">
                    <label className="form-label text-brand-accent">Selecciona el tipo de Minijuego</label>
                    <select className="form-select font-bold" value={tipoJuego} onChange={e => setTipoJuego(e.target.value)}>
                      <option value="quiz">🎯 Quiz Dinámico (Auto-detecta tema)</option>
                      <option value="quiz-multiplicacion">✖️ Quiz de Multiplicación</option>
                      <option value="quiz-lectura">📖 Quiz de Lectura y Comprensión</option>
                      <option value="divide-pan">🍞 Divide el Pan (Fracciones)</option>
                      <option value="emparejar">🔗 Empareja Fracciones y Decimales</option>
                      <option value="ordenar">🔢 Ordena los Números</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={guardar}
              disabled={guardando || !titulo}
              className="btn-burbuja btn--primario w-full shadow-brand-primary/20 shadow-2xl py-5"
            >
              {guardando ? 'Guardando cambios...' : <><Save size={24} /> Publicar Actualización</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
