'use client';

import { useState, useRef, Suspense } from 'react'; // Agregamos Suspense
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Star,
  Mic,
  Clock,
  Music,
  CircleAlert,
  Send,
  CheckCircle,
  Sparkles,
  Heart,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

// 1. Envolvemos el componente principal en Suspense
export default function EvaluacionFamiliarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Clock className="animate-spin text-brand-primary" size={40} />
      </div>
    }>
      <FormularioEvaluacion />
    </Suspense>
  );
}

// 2. Todo tu código original se mueve a este nuevo componente
function FormularioEvaluacion() {
  const searchParams = useSearchParams();
  const estudianteId = searchParams.get('estudiante') ?? '';

  const [comentario, setComentario] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLInputElement>(null);

  async function handleEnviar() {
    if (!comentario.trim() && !audio) {
      setError('Por favor, escribe un comentario o sube un audio');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('estudianteId', estudianteId);
      if (audio) formData.append('audio', audio);
      if (comentario) formData.append('comentario', comentario);

      const res = await fetch('/api/evaluacion', { method: 'POST', body: formData });
      if (res.ok) {
        setEnviado(true);
      } else {
        const d = await res.json();
        setError(d.error ?? 'Error enviando evaluación');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="card max-w-lg w-full text-center p-12 bg-white/90 shadow-2xl border-t-8 border-t-brand-success">
          <div className="w-24 h-24 bg-brand-success/10 rounded-full flex-center text-brand-success mx-auto mb-8 anim-bounceIn">
            <CheckCircle size={50} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">¡Muchas Gracias!</h1>
          <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10">
            Tu participación es fundamental para el crecimiento de tu hijo/a. La maestra recibirá tu comentario muy pronto.
          </p>
          <div className="flex-center gap-2 text-brand-secondary font-black animate-pulse uppercase tracking-widest text-sm">
            <Heart className="fill-brand-secondary" size={20} /> Comunidad Unida <Heart className="fill-brand-secondary" size={20} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="text-center space-y-6">
          <div className="w-24 h-24 bg-brand-primary rounded-[32px] flex-center text-white mx-auto shadow-xl shadow-brand-primary/20 rotate-3 anim-flotar">
            <Users size={50} strokeWidth={2} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Evaluación Familiar
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-md mx-auto">
              Cuéntanos cómo aplica tu hijo/a lo aprendido en la vida diaria.
            </p>
          </div>
        </header>

        <main className="space-y-8 anim-fadeInUp">
          <div className="card bg-white border-2 border-white shadow-premium">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="form-label flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={18} /> Tu mensaje para la maestra:
                </label>
                <textarea
                  className="form-textarea min-h-[160px] text-lg font-medium"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Ej: Hoy Lucía nos ayudó a repartir el pan en partes iguales para toda la familia..."
                />
              </div>

              <div className="space-y-4">
                <label className="form-label flex items-center gap-2">
                  <Mic className="text-brand-info" size={18} /> ¿Prefieres un mensaje de voz?
                </label>
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    className="btn-burbuja bg-brand-info/10 text-brand-info border-2 border-dashed border-brand-info/30 hover:bg-brand-info hover:text-white"
                    onClick={() => audioRef.current?.click()}
                  >
                    <Mic size={24} /> {audio ? 'Cambiar grabación' : 'Subir audio de voz'}
                  </button>
                  <input
                    ref={audioRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {audio && (
                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between animate-fadeInUp">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex-center">
                          <Music size={20} />
                        </div>
                        <span className="font-bold text-slate-600 text-sm truncate max-w-[200px]">
                          {audio.name}
                        </span>
                      </div>
                      <button onClick={() => setAudio(null)} className="text-rose-500 font-black text-xs uppercase hover:underline">
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-500 font-bold text-sm">
                  <CircleAlert size={20} /> {error}
                </div>
              )}

              <button
                className={`btn-burbuja w-full py-6 text-xl shadow-2xl ${enviando ? 'opacity-70 cursor-not-allowed bg-slate-400' : 'btn--primario active:scale-[0.98]'}`}
                onClick={handleEnviar}
                disabled={enviando}
              >
                {enviando ? (
                  <Clock className="animate-spin" size={28} />
                ) : (
                  <>
                    <Send size={28} /> Enviar mi opinión
                  </>
                )}
              </button>
            </div>
          </div>

          <footer className="text-center">
            <Link href="/login" className="text-slate-400 font-black uppercase tracking-widest text-xs hover:text-brand-primary transition-colors flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Volver al Inicio
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}