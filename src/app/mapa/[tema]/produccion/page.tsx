import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProgresoCompleto } from '@/lib/progress';
import { t, type Idioma } from '@/lib/i18n';
import ProduccionClient from './ProduccionClient';

export default async function ProduccionPage({
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

  const progreso = await getProgresoCompleto(session.userId, tema.id);
  const valoracion = progreso.find((p) => p.momento === 'VALORACION');
  if (!valoracion?.completado) redirect(`/mapa?tema=${temaSlug}`);

  const contenido = await prisma.contenidoTema.findFirst({
    where: { temaId: tema.id, momento: 'PRODUCCION', idioma },
    include: { recursos: true }
  }) ?? await prisma.contenidoTema.findFirst({
    where: { temaId: tema.id, momento: 'PRODUCCION', idioma: 'es' },
    include: { recursos: true }
  });

  // Producciones anteriores del estudiante en este tema
  const produccionesAnteriores = await prisma.produccion.findMany({
    where: { userId: session.userId, temaId: tema.id, momento: 'PRODUCCION' },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const yaCompletada = progreso.find((p) => p.momento === 'PRODUCCION')?.completado ?? false;

  return (
    <ProduccionClient
      temaSlug={temaSlug}
      idioma={idioma}
      titulo={contenido?.titulo ?? 'Tu proyecto final'}
      descripcion={contenido?.descripcion ?? 'Crea y sube tu proyecto final'}
      requiereEntrega={contenido?.requiereEntrega ?? true}
      tipoActividad={contenido?.tipoActividad ?? 'evidencia'}
      tipoJuego={contenido?.tipoJuego}
      produccionesAnteriores={produccionesAnteriores.map((p) => ({
        id: p.id,
        tipo: p.tipo,
        urlArchivo: p.urlArchivo,
        reflexion: p.reflexion,
        autoEval: p.autoEval,
        feedbackMaestro: p.feedbackMaestro,
        feedbackPadrino: p.feedbackPadrino,
        createdAt: p.createdAt.toISOString(),
      }))}
      yaCompletada={yaCompletada}
      recursos={(contenido?.recursos || []).map((r: any) => ({
  ...r,
  nombre: r.nombre || "Archivo"
})) as any}
      labels={{
        momento: t(idioma, 'momento_produccion'),
        instruccion: t(idioma, 'produccion_instruccion'),
        reflexion: t(idioma, 'produccion_reflexion'),
        completar: t(idioma, 'produccion_completar'),
        evalTitulo: t(idioma, 'eval_titulo'),
        evalLogrado: t(idioma, 'eval_logrado'),
        evalProceso: t(idioma, 'eval_proceso'),
        evalAyuda: t(idioma, 'eval_ayuda'),
      }}
    />
  );
}
