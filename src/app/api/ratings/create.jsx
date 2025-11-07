import { NextResponse } from "next/server";
import prisma from "@/libs/db"; // usando tu singleton
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debes iniciar sesión para calificar" }, { status: 401 });
    }

    const { productId, value } = await req.json();
    const userId = Number(session.user.id);

    // Validar que el producto exista
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // Validar que el userId exista si es obligatorio
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }
    }

    // Validar valor entre 1 y 5
    const val = Number(value);
    if (!Number.isFinite(val) || val < 1 || val > 5) {
      return NextResponse.json({ error: "Valor de calificación inválido" }, { status: 400 });
    }

    // Crear o actualizar rating del usuario autenticado
    const rating = await prisma.rating.upsert({
      where: {
        userId_productId: { userId, productId }
      },
      update: { value: val },
      create: { value: val, productId, userId }
    });

    return NextResponse.json(rating, { status: 200 });

  } catch (error) {
    console.error("Error creando rating:", error);
    return NextResponse.json({ error: "Error al guardar rating" }, { status: 500 });
  }
}
