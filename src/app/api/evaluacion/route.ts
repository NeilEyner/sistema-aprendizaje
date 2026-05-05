import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// 1. COMENTA ESTA LÍNEA
// import { saveUploadedFile } from '@/lib/uploads';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const estudianteId = formData.get('estudianteId') as string;
    const comentario = formData.get('comentario') as string | null;
    const audioFile = formData.get('audio') as File | null;

    if (!estudianteId) {
      return NextResponse.json({ error: 'estudianteId requerido' }, { status: 400 });
    }

    const estudiante = await prisma.user.findUnique({ where: { id: estudianteId } });
    if (!estudiante) return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 });

    let urlAudio: string | null = null;

    // 2. COMENTA EL PROCESO DE GUARDADO LOCAL
    if (audioFile && audioFile.size > 0) {
      /*
      const saved = await saveUploadedFile(audioFile, estudianteId, 'familia');
      urlAudio = saved?.url ?? null;
      */
      urlAudio = "/audio-placeholder.mp3"; // Valor temporal para el build
    }

    const eval_ = await prisma.evaluacionFamiliar.create({
      data: {
        estudianteId,
        tipo: urlAudio ? 'audio' : 'texto',
        urlAudio,
        comentario: comentario?.trim() ?? null,
      },
    });

    return NextResponse.json({ ok: true, id: eval_.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}