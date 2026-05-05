import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProgresoCompleto } from '@/lib/progress';
import { t, type Idioma } from '@/lib/i18n';
import TeoriaClient from './TeoriaClient';

export default async function TeoriaPage({
  params,
}: {
  params: Promise<{ tema: string }>;
}) {
  const { tema: temaSlug } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const idioma = session.idioma as Idioma;

  const tema = await prisma.tema.findUnique({ where: { slug: temaSlug } });
  if (!tema) redirect('/mapa');

  // Verificar que Práctica está completada
  const progreso = await getProgresoCompleto(session.userId, tema.id);
  const practica = progreso.find((p) => p.momento === 'PRACTICA');
  if (!practica?.completado) redirect(`/mapa?tema=${temaSlug}`);

  // Contenido en el idioma del estudiante (fallback a español)
  const contenido = await prisma.contenidoTema.findFirst({
    where: { temaId: tema.id, momento: 'TEORIA', idioma },
    include: { recursos: true }
  }) ?? await prisma.contenidoTema.findFirst({
    where: { temaId: tema.id, momento: 'TEORIA', idioma: 'es' },
    include: { recursos: true }
  });

  const teoriaCompletada = progreso.find((p) => p.momento === 'TEORIA')?.completado ?? false;

  return (
    <TeoriaClient
      temaSlug={temaSlug}
      temaNombre={tema.nombre}
      idioma={idioma}
      contenido={contenido ? {
        titulo: contenido.titulo,
        descripcion: contenido.descripcion ?? '',
        urlAudioInstruccion: contenido.urlAudioInstruccion ?? null,
        recursos: (contenido.recursos || []).map((r: any) => ({
          ...r,
          nombre: r.nombre || "Archivo" // Esto quita el error del null
        }))
      } as any : null}
      yaCompletada={teoriaCompletada}
      labels={{
        instruccion: t(idioma, 'teoria_instruccion'),
        completar: t(idioma, 'teoria_completar'),
        momento: t(idioma, 'momento_teoria'),
      }}
    />
  );
}
