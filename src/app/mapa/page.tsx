import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { t, type Idioma } from '@/lib/i18n';
import { getProgresoCompleto } from '@/lib/progress';
import LogoutButton from '@/components/LogoutButton';
import PadrinoFlotante from '@/components/PadrinoFlotante';
import IdiomaSelector from '@/components/IdiomaSelector';
import {
  Map, 
  GraduationCap, 
  Sprout, 
  BookOpen, 
  Handshake, 
  Pencil, 
  CheckCircle, 
  Lock, 
  Globe,
  Star,
  LayoutGrid,
  Gamepad2,
  ChevronRight,
  ArrowRight,
  Users
} from 'lucide-react';

const MOMENTOS = [
  { key: 'PRACTICA', href: 'practica', icon: Sprout, color: 'bg-brand-primary', borderColor: 'border-brand-primary/20' },
  { key: 'TEORIA', href: 'teoria', icon: BookOpen, color: 'bg-brand-info', borderColor: 'border-brand-info/20' },
  { key: 'VALORACION', href: 'valoracion', icon: Handshake, color: 'bg-brand-accent', borderColor: 'border-brand-accent/20' },
  { key: 'PRODUCCION', href: 'produccion', icon: Pencil, color: 'bg-rose-400', borderColor: 'border-rose-400/20' },
] as const;

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<{ tema?: string; viewAs?: string; estudianteId?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  const isFamiliaView = params.viewAs === 'familia' && params.estudianteId;
  const targetUserId = isFamiliaView ? params.estudianteId! : session.userId;
  
  const targetUser = isFamiliaView 
    ? await prisma.user.findUnique({ where: { id: targetUserId }, select: { nombre: true, grado: true, idioma: true } })
    : null;

  const idioma = (targetUser?.idioma || session.idioma) as Idioma;
  const temaSlug = params.tema ?? 'fracciones';
  const grado = targetUser?.grado || session.grado;

  const temas = await prisma.tema.findMany({
    where: { grado, activo: true },
    orderBy: { orden: 'asc' },
  });

  const tema = await prisma.tema.findUnique({ where: { slug: temaSlug } });
  if (!tema) redirect('/mapa?tema=fracciones');

  const progreso = await getProgresoCompleto(targetUserId, tema.id);
  const progresoMap = Object.fromEntries(progreso.map((p) => [p.momento, p]));

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { padrinoId: true, padrino: { select: { nombre: true, id: true } } },
  });

  const mensajesNoLeidos = await prisma.mensaje.count({
    where: { receptorId: session.userId, leido: false },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── TOP NAVIGATION ── */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-primary rounded-xl flex-center text-white shadow-lg shadow-brand-primary/20">
                <GraduationCap size={24} />
             </div>
             <span className="text-xl font-black text-slate-800 tracking-tight">{t(idioma, 'app_name')}</span>
          </div>
          <div className="flex items-center gap-3">
            <IdiomaSelector />
            <LogoutButton idioma={idioma} />
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <header className="px-6 pt-12 pb-8 bg-white border-b border-slate-100 overflow-hidden relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              {isFamiliaView && (
                <div className="bg-brand-accent/10 border-2 border-brand-accent/20 rounded-2xl p-4 mb-6 flex items-center gap-4 anim-fadeInUp">
                  <div className="w-12 h-12 bg-brand-accent text-white rounded-full flex-center shrink-0 shadow-lg shadow-brand-accent/20">
                     <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-brand-accent uppercase tracking-widest">{t(idioma, 'familia_portal')}</p>
                    <p className="text-slate-800 font-bold leading-tight">
                      {t(idioma, 'familia_viendo_progreso')}: <span className="text-brand-accent">{targetUser?.nombre}</span>
                    </p>
                  </div>
                  <Link href="/familia" className="ml-auto btn-burbuja btn--primario py-2 px-4 text-xs bg-brand-accent hover:bg-brand-accent/90">
                    {t(idioma, 'familia_evaluar_logros')}
                  </Link>
                </div>
              )}
              <p className="text-brand-primary font-black uppercase tracking-widest text-sm mb-2">
                {isFamiliaView ? t(idioma, 'familia_progreso_hijo') : `¡Hola, ${session.nombre}!`}
              </p>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                {t(idioma, 'mapa_titulo')}
              </h1>
              <div className="flex items-center gap-3">
                 <span className="badge bg-brand-info text-white px-4 py-1.5 text-sm font-bold shadow-lg shadow-brand-info/20">
                    {t(idioma, 'estudiante_tema_actual')}: {tema.nombre}
                 </span>
              </div>
            </div>

            {/* Selector de Temas */}
            <div className="flex flex-wrap gap-2">
              {temas.map((t_) => (
                <Link
                  key={t_.id}
                  href={`/mapa?tema=${t_.slug}`}
                  className={`px-4 py-2 rounded-2xl font-bold transition-all ${t_.slug === temaSlug ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {t_.nombre}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* Adornos decorativos */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-info/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl" />
      </header>

      {/* ── MAIN MAP ── */}
      <main className="flex-1 py-16 px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto">
          {MOMENTOS.map((m, index) => {
            const p = progresoMap[m.key];
            const isLeft = index % 2 === 0;
            const label = t(idioma, `momento_${m.href}` as Parameters<typeof t>[1]);
            const IconComponent = m.icon;

            return (
              <div key={m.key} className="relative mb-24">
                {/* Conector Visual entre nodos */}
                {index < MOMENTOS.length - 1 && (
                  <div className={`absolute top-24 left-1/2 -ml-0.5 w-1 h-32 bg-slate-200 z-0 ${index % 2 === 0 ? 'rotate-[15deg]' : '-rotate-[15deg]'} origin-top`} />
                )}

                <div className={`flex items-center gap-8 relative z-10 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Nodo Circular */}
                  <div className="flex-shrink-0">
                    <Link
                      href={p?.disponible ? `/mapa/${temaSlug}/${m.href}` : '#'}
                      className={`block group transition-all duration-500 ${!p?.disponible ? 'cursor-not-allowed grayscale' : 'hover:scale-110 active:scale-95'}`}
                    >
                      <div className={`w-32 h-32 rounded-[40px] flex-center relative overflow-hidden border-4 bg-white shadow-2xl transition-all ${p?.completado ? 'border-emerald-500' : p?.disponible ? 'border-white' : 'border-slate-100'}`}>
                        {/* Icono Principal */}
                        <div className={`transition-all duration-500 ${p?.completado ? 'text-emerald-500' : p?.disponible ? m.color + ' text-white' : 'text-slate-300'}`}>
                           {p?.completado ? <CheckCircle size={60} strokeWidth={2.5} /> : p?.disponible ? <IconComponent size={50} /> : <Lock size={40} />}
                        </div>
                        
                        {/* Indicador de número */}
                        <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-2xl flex-center font-black text-lg shadow-lg ${p?.completado ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
                          {index + 1}
                        </div>

                        {/* Efecto hover */}
                        {p?.disponible && !p.completado && (
                           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Etiqueta y Info */}
                  <div className={`flex-1 ${isLeft ? 'text-left' : 'text-right'}`}>
                    <div className={`inline-block p-6 rounded-[32px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 transition-all ${p?.disponible ? 'hover:border-brand-primary/30' : ''}`}>
                      <h3 className="text-2xl font-black text-slate-800 mb-1">{label}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p?.completado ? 'bg-emerald-500' : p?.disponible ? 'bg-brand-primary animate-pulse' : 'bg-slate-300'}`} />
                        <span className="font-bold text-slate-400 text-sm uppercase tracking-wider">
                          {p?.disponible ? (p.completado ? '¡Logrado!' : '¡A trabajar!') : 'Próximamente'}
                        </span>
                      </div>
                      {p?.disponible && (
                         <Link href={`/mapa/${temaSlug}/${m.href}`} className="mt-4 flex items-center gap-1 font-black text-brand-primary group">
                            {p.completado ? 'Ver de nuevo' : 'Comenzar ahora'}
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                         </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── GAMES SECTION ── */}
      <section className="px-6 py-12 bg-slate-50 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="card bg-gradient-to-br from-brand-accent to-indigo-600 p-10 relative overflow-hidden shadow-2xl shadow-brand-accent/30 group">
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex-center text-white backdrop-blur-md shadow-inner">
                   <Gamepad2 size={50} />
                </div>
                <div className="flex-1 text-center md:text-left text-white">
                   <h2 className="text-4xl font-black mb-2 tracking-tight">¡Zona de Juegos!</h2>
                   <p className="text-xl text-white/80 font-medium mb-8">
                      Refuerza lo aprendido sobre {tema.nombre.toLowerCase()} con minijuegos divertidos.
                   </p>
                   <Link href={`/mapa/${temaSlug}/juegos`} className="inline-flex items-center gap-3 bg-white text-brand-accent px-8 py-4 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                      <Star size={24} className="fill-brand-accent" /> ¡A Jugar! <ArrowRight />
                   </Link>
                   <a href="/evaluacion-fracciones.html" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-white/20 border-2 border-white text-white px-8 py-4 rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl mt-4">
                      <GraduationCap size={24} /> Evaluación <ArrowRight />
                   </a>
                </div>
             </div>
             {/* Decoración */}
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                <LayoutGrid size={200} />
             </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-sm italic">
             {t(idioma, 'mapa_subtitulo')}
          </p>
          <div className="flex justify-center gap-10">
             <div className="text-center">
                <p className="text-3xl font-black text-slate-800">{progreso.filter(p => p.completado).length}</p>
                <p className="text-slate-400 font-bold text-xs">LOGROS</p>
             </div>
             <div className="text-center">
                <p className="text-3xl font-black text-slate-800">{temas.length}</p>
                <p className="text-slate-400 font-bold text-xs">TEMAS</p>
             </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING PADRINO ── */}
      {user?.padrino && (
        <PadrinoFlotante
          padrinoNombre={user.padrino.nombre}
          padrinoId={user.padrino.id!}
          mensajesNoLeidos={mensajesNoLeidos}
          idioma={idioma}
        />
      )}
    </div>
  );
}
