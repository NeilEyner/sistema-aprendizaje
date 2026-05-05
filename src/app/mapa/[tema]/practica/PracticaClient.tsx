'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sprout, 
  Camera, 
  Mic, 
  Music, 
  X, 
  CircleAlert, 
  CheckCircle, 
  ChevronLeft,
  Video,
  Image as ImageIcon,
  Gamepad2,
  FileText,
  PlayCircle,
  ExternalLink,
  UploadCloud,
  Check
} from 'lucide-react';
import JuegoInteractivo from '../juegos/JuegoInteractivo';

type Recurso = {
  tipo: string;
  url: string;
  nombre: string;
};

export default function PracticaClient({ 
  temaSlug, 
  idioma,
  contenido, 
  labels 
}: { 
  temaSlug: string, 
  idioma: any,
  contenido: any,
  labels: any
}) {
  const router = useRouter();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [texto, setTexto] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const titulo = contenido?.titulo || '¿Cómo compartimos en casa?';
  const descripcion = contenido?.descripcion || 'Sube una foto o audio mostrando cómo dividen el pan, la fruta u otro alimento en tu hogar para que alcance para todos.';

  const requiereEntrega = contenido?.requiereEntrega ?? true;
  const tipoActividad = contenido?.tipoActividad ?? 'evidencia'; 
  const recursos: Recurso[] = contenido?.recursos || [];

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleEnviar() {
    if (tipoActividad === 'evidencia' && requiereEntrega && !archivo && !texto.trim()) {
      setError('Sube una foto, audio o escribe algo antes de continuar');
      return;
    }
    setEnviando(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('temaSlug', temaSlug);
      formData.append('momento', 'PRACTICA');
      if (archivo) formData.append('archivo', archivo);
      if (texto) formData.append('reflexion', texto);

      if (archivo || texto.trim()) {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          const d = await uploadRes.json();
          setError(d.error ?? 'Error subiendo archivo');
          return;
        }
      }

      const progRes = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temaSlug, momento: 'PRACTICA' }),
      });
      if (!progRes.ok) {
        const d = await progRes.json();
        setError(d.error ?? 'Error guardando progreso');
        return;
      }

      router.push(`/mapa?tema=${temaSlug}`);
    } catch {
      setError('Error de conexión.');
    } finally {
      setEnviando(false);
    }
  }

  if (tipoActividad === 'juego') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <button onClick={() => router.push(`/mapa?tema=${temaSlug}`)} className="btn-burbuja btn--secundario p-3">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1">
              <span className="badge bg-brand-info text-white px-3 py-1 text-xs mb-1">MOMENTO: {labels.momento}</span>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{titulo}</h1>
            </div>
          </header>
          <div className="card p-8 mb-8 text-center bg-white shadow-xl shadow-brand-info/10">
            <p className="text-xl text-slate-600 mb-8">{descripcion}</p>
            <JuegoInteractivo temaSlug={temaSlug} tipoJuego={contenido?.tipoJuego} onComplete={handleEnviar} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => router.push(`/mapa?tema=${temaSlug}`)} className="btn-burbuja btn--secundario p-3">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <span className="badge bg-brand-primary text-white px-3 py-1 text-xs mb-1 uppercase">Momento: {tipoActividad === 'lectura' ? 'Lectura' : 'Práctica'}</span>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{titulo}</h1>
          </div>
        </header>

        <main className="space-y-8">
          <div className="card p-8">
            <p className="text-xl text-slate-700 leading-relaxed mb-8">{descripcion}</p>

            {recursos.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <PlayCircle className="text-brand-primary" /> {labels.recursos}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recursos.map((rec, i) => (
                    <a 
                      key={i} 
                      href={rec.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-primary/30 transition-all group"
                    >
                      <div className={`w-12 h-12 rounded-xl flex-center ${rec.tipo === 'video' ? 'bg-rose-100 text-rose-500' : 'bg-brand-info/10 text-brand-info'}`}>
                        {rec.tipo === 'video' ? <Video size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-bold text-slate-700 truncate group-hover:text-brand-primary transition-colors">{rec.nombre}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase">{rec.tipo}</p>
                      </div>
                      <ExternalLink size={18} className="text-slate-300 group-hover:text-brand-primary" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {requiereEntrega && tipoActividad === 'evidencia' && (
            <div className="card p-8 bg-brand-primary/5 border-2 border-brand-primary/10">
              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <UploadCloud className="text-brand-primary" /> {labels.turnoCrear}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  className="btn-burbuja bg-white text-slate-700 border-2 border-slate-100 p-6 flex flex-col items-center gap-2 hover:border-brand-info group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-brand-info/10 rounded-full flex-center text-brand-info group-hover:scale-110 transition-transform">
                    <Camera size={32} />
                  </div>
                  <span className="font-bold">{labels.subirFoto}</span>
                </button>
                <button
                  type="button"
                  className="btn-burbuja bg-white text-slate-700 border-2 border-slate-100 p-6 flex flex-col items-center gap-2 hover:border-brand-accent group"
                  onClick={() => audioInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex-center text-brand-accent group-hover:scale-110 transition-transform">
                    <Mic size={32} />
                  </div>
                  <span className="font-bold">{labels.subirAudio}</span>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} hidden />
              <input ref={audioInputRef} type="file" accept="audio/*" onChange={onFileChange} hidden />

              {(preview || archivo) && (
                <div className="mb-8 p-4 bg-white rounded-3xl shadow-sm border border-slate-100 relative anim-bounceIn">
                  <button 
                    onClick={() => { setArchivo(null); setPreview(null); }}
                    className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex-center shadow-lg hover:scale-110 transition-transform z-10"
                  >
                    <X size={20} />
                  </button>
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-auto rounded-2xl max-h-[300px] object-cover" />
                  ) : (
                    <div className="flex items-center gap-4 p-4">
                      <Music className="text-brand-primary" size={32} />
                      <span className="font-bold text-slate-700 truncate">{archivo?.name}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <label className="font-bold text-slate-600 block px-2">{labels.instruccion}</label>
                <textarea
                  className="w-full rounded-3xl border-2 border-slate-100 p-6 focus:border-brand-primary focus:ring-0 transition-all text-lg min-h-[150px]"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={labels.placeholder}
                />
              </div>
            </div>
          )}

          {tipoActividad === 'lectura' && (
            <div className="card p-10 text-center bg-emerald-50 border-2 border-emerald-100">
               <div className="w-20 h-20 bg-white rounded-full flex-center text-emerald-500 mx-auto mb-6 shadow-sm">
                  <CheckCircle size={40} />
               </div>
               <h3 className="text-2xl font-black text-slate-800 mb-2">¡Listo para continuar!</h3>
               <p className="text-slate-600 text-lg">Has revisado el material de lectura. ¡Buen trabajo!</p>
            </div>
          )}

          {error && <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl font-bold text-center">{error}</div>}

          <button
            onClick={handleEnviar}
            disabled={enviando || (tipoActividad === 'evidencia' && requiereEntrega && !archivo && !texto.trim())}
            className="btn-burbuja btn--primario w-full py-6 text-xl shadow-2xl shadow-brand-primary/30"
          >
              <><Check size={28} /> {labels.completar}</>
          </button>
        </main>
      </div>
    </div>
  );
}
