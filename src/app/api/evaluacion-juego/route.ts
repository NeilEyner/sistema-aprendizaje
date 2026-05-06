// archivo: src/app/api/evaluacion-juego/route.ts
// Coloca este archivo en tu proyecto Next.js en esa ruta exacta.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─────────────────────────────────────────────────────
// POST /api/evaluacion-juego
// Recibe el resultado del juego y lo guarda en la base de datos.
// También crea un registro de Progreso para el momento PRODUCCION.
// ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario, nota, correctas, total, fecha, detalle } = body;

    if (!usuario || nota === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Buscar al estudiante por su nombre de usuario
    const estudiante = await prisma.user.findUnique({
      where: { usuario: usuario.toLowerCase().trim() },
    });

    if (!estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });
    }

    // 2. Buscar el tema de fracciones (por nombre aproximado)
    //    Ajusta el nombre según cómo lo creó la maestra en el sistema.
    const tema = await prisma.tema.findFirst({
      where: {
        nombre: { contains: 'fraccion', mode: 'insensitive' },
      },
    });

    // 3. Guardar como EvaluacionFamiliar con comentario estructurado
    //    (reutilizamos este modelo que ya existe en tu schema)
    const resumenJSON = JSON.stringify({
      juego: 'Desafío de la Cosecha',
      nota,
      correctas,
      total,
      fecha,
      detalle,
    });

    await prisma.evaluacionFamiliar.create({
      data: {
        estudianteId: estudiante.id,
        temaId: tema?.id ?? null,
        tipo: 'texto',
        urlAudio: null,
        comentario: resumenJSON,
        validado: false,
      },
    });

    // 4. Marcar el momento PRODUCCION como completado (si existe el tema)
    if (tema) {
      await prisma.progreso.upsert({
        where: {
          userId_temaId_momento: {
            userId: estudiante.id,
            temaId: tema.id,
            momento: 'PRODUCCION',
          },
        },
        update: {
          completado: true,
          completadoAt: new Date(),
        },
        create: {
          userId: estudiante.id,
          temaId: tema.id,
          momento: 'PRODUCCION',
          completado: true,
          completadoAt: new Date(),
        },
      });
    }

    return NextResponse.json({ ok: true, nota, estudiante: estudiante.nombre });
  } catch (error) {
    console.error('[evaluacion-juego] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────
// GET /api/evaluacion-juego
// La maestra llama a este endpoint para ver todos los resultados.
// Protegido: solo el rol MAESTRO puede acceder.
// ─────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    // Verificar que es la maestra (puedes añadir tu lógica de auth aquí)
    const authHeader = request.headers.get('x-usuario');
    const maestra = await prisma.user.findUnique({
      where: { usuario: authHeader ?? '' },
    });
    if (!maestra || maestra.rol !== 'MAESTRO') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todos los registros del juego
    // Son los que tienen 'Desafío de la Cosecha' en el comentario
    const registros = await prisma.evaluacionFamiliar.findMany({
      where: {
        comentario: { contains: 'Desafío de la Cosecha' },
      },
      include: {
        estudiante: { select: { nombre: true, usuario: true, grado: true } },
      },
      orderBy: { id: 'desc' },
    });

    // Formatear para el panel de la maestra
    const resultados = registros.map((r: any) => {
      let datos = null;
      try { datos = JSON.parse(r.comentario ?? '{}'); } catch {}
      return {
        id: r.id,
        estudiante: r.estudiante.nombre,
        usuario: r.estudiante.usuario,
        grado: r.estudiante.grado,
        nota: datos?.nota ?? '—',
        correctas: datos?.correctas ?? '—',
        total: datos?.total ?? '—',
        fecha: datos?.fecha ? new Date(datos.fecha).toLocaleDateString('es-BO') : '—',
        estado: (datos?.nota ?? 0) >= 50 ? '✅ Aprobado' : '⚠️ Necesita refuerzo',
      };
    });

    return NextResponse.json({ ok: true, resultados });
  } catch (error) {
    console.error('[evaluacion-juego GET] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
