'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  User, 
  Handshake, 
  Bell, 
  Clock, 
  HelpCircle, 
  Star, 
  Send, 
  CircleAlert,
  ChevronLeft,
  Mail,
  Users,
  MessageSquare,
  Search,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

type Conversacion = {
  userId: string;
  nombre: string;
  rol: string;
  mensajesNoLeidos: number;
  ultimoMensaje: string | null;
};

type Mensaje = {
  id: string;
  contenido: string;
  emisorId: string;
  createdAt: string;
  emisor: { nombre: string };
};

type Alerta = {
  id: string;
  tipo: string;
  mensaje: string;
  createdAt: string;
  ahijado: { nombre: string };
};

type Props = {
  sessionUserId: string;
  sessionRol: string;
  sessionNombre: string;
  conversaciones: Conversacion[];
  padrinoInfo: { id: string; nombre: string } | null;
  mensajesConPadrino: Mensaje[];
  produccionesAhijados: any[];
  alertasIniciales: Alerta[];
};

const ROL_ICON: Record<string, any> = {
  ESTUDIANTE: User,
  PADRINO: Handshake,
  MAESTRO: Users,
};

export default function TutoriaClient({
  sessionUserId, sessionRol, padrinoInfo,
  mensajesConPadrino, conversaciones, alertasIniciales, produccionesAhijados,
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    padrinoInfo?.id ?? (conversaciones[0]?.userId ?? null)
  );
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesConPadrino);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [alertas] = useState<Alerta[]>(alertasIniciales);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [padrinoFeedbacks, setPadrinoFeedbacks] = useState<Record<string, string>>({});
  const [guardandoPadrino, setGuardandoPadrino] = useState<Record<string, boolean>>({});
  const [producciones, setProducciones] = useState(produccionesAhijados);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Polling para nuevos mensajes
  useEffect(() => {
    if (!selectedUserId) return;
    const interval = setInterval(() => {
      refreshMensajes();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  async function refreshMensajes() {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`/api/tutoria/mensajes?conUserId=${selectedUserId}`);
      const data = await res.json();
      if (res.ok) setMensajes(data.mensajes ?? []);
    } catch (e) { console.error('Polling error', e); }
  }

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversaciones = conversaciones.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const destinatario = padrinoInfo
    ? padrinoInfo
    : conversaciones.find((c) => c.userId === selectedUserId);

  async function loadMensajes(conUserId: string) {
    setSelectedUserId(conUserId);
    try {
      const res = await fetch(`/api/tutoria/mensajes?conUserId=${conUserId}`);
      const data = await res.json();
      setMensajes(data.mensajes ?? []);
    } catch {
      setError('Error cargando mensajes');
    }
  }

  async function enviar() {
    if (!texto.trim() || !selectedUserId) return;
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/tutoria/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receptorId: selectedUserId, contenido: texto }),
      });
      const data = await res.json();
      if (res.ok) {
        setMensajes((prev) => [...prev, data.mensaje]);
        setTexto('');
      } else {
        setError(data.error ?? 'Error enviando mensaje');
      }
    } catch {
      setError('Sin conexión');
    } finally {
      setEnviando(false);
    }
  }

  async function guardarFeedbackPadrino(prodId: string) {
    const feedback = padrinoFeedbacks[prodId];
    if (!feedback?.trim()) return;
    setGuardandoPadrino(prev => ({ ...prev, [prodId]: true }));
    try {
      const res = await fetch('/api/tutoria/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produccionId: prodId, feedback }),
      });
      if (res.ok) {
        setProducciones(prev => prev.map(p => p.id === prodId ? { ...p, feedbackPadrino: feedback } : p));
      }
    } catch { setError('Error al guardar feedback'); }
    finally { setGuardandoPadrino(prev => ({ ...prev, [prodId]: false })); }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── HEADER ── */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/mapa" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft size={28} className="text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex-center text-white shadow-lg shadow-brand-primary/20">
                {sessionRol === 'ESTUDIANTE' ? <Handshake size={28} /> : <Mail size={28} />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  {sessionRol === 'ESTUDIANTE' ? 'Mi Padrino Digital' : 'Centro de Tutoría'}
                </h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {sessionRol === 'ESTUDIANTE' ? 'Guía y apoyo constante' : 'Comunicación entre pares'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── COLUMNA IZQUIERDA: Sidebar (Conversaciones/Alertas) ── */}
        <div className="lg:col-span-4 space-y-8 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* ALERTAS (solo padrino/maestro) */}
          {(sessionRol === 'PADRINO' || sessionRol === 'MAESTRO') && alertas.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Bell size={16} /> Alertas Críticas
                </h2>
                <span className="badge bg-rose-100 text-rose-600">{alertas.length}</span>
              </div>
              <div className="space-y-3">
                {alertas.map((a) => (
                  <div key={a.id} className="card p-4 border-l-8 border-l-rose-500 bg-rose-50/30 hover:bg-rose-50/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex-center flex-shrink-0">
                        {a.tipo === 'inactividad' ? <Clock size={20} /> : <HelpCircle size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">{a.mensaje}</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium italic">
                          Ahijado: {a.ahijado.nombre} • {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* LISTA DE CONVERSACIONES */}
          {(sessionRol === 'PADRINO' || sessionRol === 'MAESTRO') && (
            <section className="space-y-4">
               <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={16} /> Mis Estudiantes
                </h2>
              </div>
              
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar alumno..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-bold text-slate-600"
                />
              </div>

              <div className="space-y-2">
                {filteredConversaciones.map((c) => {
                  const Icon = ROL_ICON[c.rol] ?? User;
                  return (
                    <button
                      key={c.userId}
                      onClick={() => loadMensajes(c.userId)}
                      className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedUserId === c.userId ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]' : 'bg-white hover:bg-slate-50 border border-slate-100'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex-center flex-shrink-0 ${selectedUserId === c.userId ? 'bg-white/20' : 'bg-brand-primary/10 text-brand-primary'}`}>
                        <Icon size={24} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className={`font-black truncate ${selectedUserId === c.userId ? 'text-white' : 'text-slate-800'}`}>
                          {c.nombre}
                        </p>
                        {c.ultimoMensaje && (
                          <p className={`text-xs truncate ${selectedUserId === c.userId ? 'text-white/80' : 'text-slate-400'}`}>
                            {c.ultimoMensaje}
                          </p>
                        )}
                      </div>
                      {c.mensajesNoLeidos > 0 && (
                        <div className={`w-6 h-6 rounded-full flex-center text-[10px] font-black ${selectedUserId === c.userId ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}>
                          {c.mensajesNoLeidos}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Entregas de Ahijados (Para Padrinos) */}
          {sessionRol === 'PADRINO' && (
            <section className="space-y-6 pt-8 border-t border-slate-100">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                  <Star size={16} className="text-amber-400" /> Entregas de mis Ahijados
               </h2>
               <div className="space-y-4">
                  {producciones.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                       <p className="text-xs text-slate-400 font-bold uppercase">No hay entregas pendientes</p>
                    </div>
                  ) : (
                    producciones.map(p => (
                      <div key={p.id} className={`card p-5 border-2 transition-all ${p.feedbackPadrino ? 'border-emerald-100 opacity-70' : 'border-brand-primary/20 shadow-lg'}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <p className="font-bold text-slate-800">{p.userNombre}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase">{p.temaNombre}</p>
                            </div>
                            <span className="text-[10px] text-slate-300 font-bold">{new Date(p.createdAt).toLocaleDateString()}</span>
                         </div>

                         {p.reflexion && <p className="text-xs text-slate-600 italic mb-4 bg-slate-50 p-3 rounded-xl">"{p.reflexion}"</p>}
                         
                         {p.urlArchivo && (
                           <a href={p.urlArchivo} target="_blank" rel="noopener noreferrer" className="btn-burbuja btn--secundario py-2 text-[10px] mb-4 w-full flex-center gap-2">
                              Ver Proyecto <ExternalLink size={12} />
                           </a>
                         )}

                         <div className="space-y-3 pt-3 border-t border-slate-50">
                            <textarea 
                              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-brand-primary text-xs outline-none"
                              placeholder="Escribe una nota para tu ahijado..."
                              rows={2}
                              value={padrinoFeedbacks[p.id] || p.feedbackPadrino || ''}
                              onChange={e => setPadrinoFeedbacks({...padrinoFeedbacks, [p.id]: e.target.value})}
                              disabled={!!p.feedbackPadrino}
                            />
                            {!p.feedbackPadrino && (
                              <button 
                                onClick={() => guardarFeedbackPadrino(p.id)}
                                disabled={guardandoPadrino[p.id] || !padrinoFeedbacks[p.id]}
                                className="btn-burbuja btn--primario w-full py-2 text-[10px]"
                              >
                                {guardandoPadrino[p.id] ? 'Guardando...' : 'Enviar Nota'}
                              </button>
                            )}
                            {p.feedbackPadrino && <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCheck size={12}/> Revisado por ti</p>}
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </section>
          )}

          {sessionRol === 'ESTUDIANTE' && padrinoInfo && (
            <section className="space-y-4">
               <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Mi Padrino Digital</h2>
               <div className="card p-6 bg-white border-2 border-brand-primary/20 shadow-xl anim-fadeInUp">
                  <div className="flex flex-col items-center text-center">
                     <div className="w-20 h-20 bg-brand-primary rounded-[2.5rem] flex-center text-white mb-4 shadow-lg shadow-brand-primary/20">
                        <User size={40} />
                     </div>
                     <h3 className="text-xl font-black text-slate-800">{padrinoInfo.nombre}</h3>
                     <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mt-1">Tu Guía Digital</p>
                     <div className="mt-6 w-full pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                          Puedes preguntarle cualquier duda sobre tus tareas o el uso de la plataforma.
                        </p>
                     </div>
                  </div>
               </div>
            </section>
          )}

          {sessionRol === 'ESTUDIANTE' && !padrinoInfo && (
            <div className="card text-center p-10 bg-white">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex-center mx-auto mb-6 text-slate-300">
                <Users size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Sin Padrino Asignado</h3>
              <p className="text-slate-400 font-medium">Pide a tu maestra que te asigne un padrino o madrina digital.</p>
            </div>
          )}
        </div>

        {/* ── COLUMNA DERECHA: Chat ── */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-140px)] bg-white rounded-[2.5rem] border border-slate-200 shadow-premium overflow-hidden">
          {selectedUserId && destinatario ? (
            <>
              {/* Top Bar Chat */}
              <div className="px-8 py-5 border-b border-slate-100 bg-white/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-info/10 text-brand-info rounded-full flex-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">{destinatario.nombre}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">En línea</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Star size={20} />
                </button>
              </div>

              {/* Mensajes Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#fcfdff] custom-scrollbar">
                {mensajes.length === 0 ? (
                  <div className="h-full flex-center flex-col text-slate-300 space-y-4">
                    <div className="w-20 h-20 border-4 border-dashed border-slate-100 rounded-full flex-center">
                       <MessageSquare size={32} />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-sm">Empieza la charla con un saludo</p>
                  </div>
                ) : (
                  mensajes.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.emisorId === sessionUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-6 py-4 rounded-3xl shadow-sm relative group ${
                        m.emisorId === sessionUserId 
                          ? 'bg-brand-primary text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{m.contenido}</p>
                        <div className={`flex items-center gap-2 mt-2 ${m.emisorId === sessionUserId ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] font-bold uppercase ${m.emisorId === sessionUserId ? 'text-white/60' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.emisorId === sessionUserId && <CheckCheck size={12} className="text-white/60" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-end gap-4 bg-slate-50 p-4 rounded-3xl border-2 border-transparent focus-within:border-brand-primary/20 focus-within:bg-white transition-all">
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribe un mensaje para ayudar o preguntar..."
                    className="flex-1 bg-transparent border-none outline-none resize-none font-medium text-slate-600 max-h-32 min-h-[24px]"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        enviar();
                      }
                    }}
                  />
                  <button
                    onClick={enviar}
                    disabled={enviando || !texto.trim()}
                    className={`p-4 rounded-2xl transition-all shadow-lg ${enviando || !texto.trim() ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-brand-primary text-white hover:scale-110 active:scale-95 shadow-brand-primary/30'}`}
                  >
                    {enviando ? <Clock className="animate-spin" size={24} /> : <Send size={24} />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-bold mt-2 flex items-center gap-1">
                    <CircleAlert size={14} /> {error}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex-center flex-col text-slate-300 p-12 text-center">
              <div className="w-32 h-32 bg-slate-50 rounded-[40px] flex-center mb-8">
                <Handshake size={60} strokeWidth={1} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Centro de Comunicación</h3>
              <p className="max-w-xs mx-auto font-medium">Selecciona a un estudiante a la izquierda para ver su progreso y conversar.</p>
            </div>
          )}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
