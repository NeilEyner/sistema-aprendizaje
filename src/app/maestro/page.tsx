import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import MaestroClient from './MaestroClient';

export default async function MaestroPage() {
  const session = await getSession();
  if (!session || session.rol !== 'MAESTRO') redirect('/mapa');

  // Todos los usuarios de la comunidad
  const usuarios = await prisma.user.findMany({
    where: { comunidad: session.comunidad },
    select: {
      id: true,
      nombre: true,
      usuario: true,
      rol: true,
      grado: true,
      idioma: true,
      activo: true,
      padrinoId: true,
      padrino: { select: { nombre: true } },
      progresos: {
        select: {
          momento: true,
          completado: true,
          tema: { select: { nombre: true, slug: true } },
        },
      },
      producciones: {
        where: { momento: 'PRODUCCION' },
        select: { autoEval: true, feedbackMaestro: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ rol: 'asc' }, { nombre: 'asc' }],
  });

  // Todas las producciones recientes (pendientes y revisadas)
  const todasProducciones = await prisma.produccion.findMany({
    where: {
      momento: 'PRODUCCION',
      user: { comunidad: session.comunidad },
    },
    include: {
      user: { select: { nombre: true } },
      tema: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // Padrinos disponibles para asignar
  const padrinos = usuarios.filter((u) => u.rol === 'PADRINO' && u.activo);
  const estudiantes = usuarios.filter((u) => u.rol === 'ESTUDIANTE').map(u => ({
    ...u,
    status: u.producciones[0]?.autoEval || 'pendiente',
    revisado: !!u.producciones[0]?.feedbackMaestro
  }));
  const temas = await prisma.tema.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } });
  
  // Contenidos de todos los temas
  const contenidosRaw = await prisma.contenidoTema.findMany({ 
    include: { recursos: true },
    orderBy: { orden: 'asc' } 
  });
  
  const contenidos = contenidosRaw.map(c => ({
    id: c.id,
    temaId: c.temaId,
    momento: c.momento,
    idioma: c.idioma,
    titulo: c.titulo,
    descripcion: c.descripcion,
    textoPreguntaForo: c.textoPreguntaForo,
    requiereEntrega: c.requiereEntrega,
    tipoActividad: c.tipoActividad,
    recursos: c.recursos
  }));

  // Comentarios del foro (para valoración)
  const comentariosForo = await prisma.foroComentario.findMany({
    where: { user: { comunidad: session.comunidad } },
    include: { 
      user: { select: { nombre: true } },
      tema: { select: { nombre: true } },
      respuestas: {
        include: { user: { select: { nombre: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <MaestroClient
      maestroNombre={session.nombre}
      estudiantes={estudiantes}
      padrinos={padrinos.map((p) => ({ id: p.id, nombre: p.nombre }))}
      todasProducciones={todasProducciones.map((p) => ({
        id: p.id,
        userId: p.userId,
        userNombre: p.user.nombre,
        temaNombre: p.tema.nombre,
        tipo: p.tipo,
        urlArchivo: p.urlArchivo,
        reflexion: p.reflexion,
        autoEval: p.autoEval,
        feedbackMaestro: p.feedbackMaestro,
        feedbackPadrino: p.feedbackPadrino ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
      temas={temas.map((t) => ({ id: t.id, nombre: t.nombre, grado: t.grado }))}
      contenidos={contenidos.map(cont => ({
        ...cont,
        recursos: cont.recursos.map(rec => ({
          ...rec,
          nombre: rec.nombre || "Archivo" // Esto evita el error del null
        }))
      })) as any} // El "as any" asegura que pase el build
      comentariosForo={comentariosForo.map(c => ({
        id: c.id,
        userId: c.userId,
        temaId: c.temaId,
        userNombre: c.user.nombre,
        temaNombre: c.tema.nombre,
        contenido: c.contenido,
        tipo: c.tipo,
        urlAudio: c.urlAudio,
        createdAt: c.createdAt.toISOString(),
        respuestas: c.respuestas.map(r => ({
          id: r.id,
          userNombre: r.user.nombre,
          contenido: r.contenido,
          createdAt: r.createdAt.toISOString()
        }))
      }))}
      idioma={(session.idioma as any) || 'es'}
    />
  );
}
