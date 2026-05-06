// archivo: src/app/api/estudiantes-juego/route.ts
// Devuelve la lista de estudiantes activos para el selector del juego.
// No requiere autenticación especial porque solo devuelve nombre y usuario.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const estudiantes = await prisma.user.findMany({
      where: { rol: 'ESTUDIANTE' },
      select: { nombre: true, usuario: true },
      orderBy: { nombre: 'asc' },
    });
    return NextResponse.json({ estudiantes });
  } catch (error) {
    console.error('[estudiantes-juego]', error);
    return NextResponse.json({ estudiantes: [] });
  }
}
