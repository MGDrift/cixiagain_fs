import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const kits = await prisma.kit.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, price: true } } },
      },
    },
  });
  return NextResponse.json(kits);
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const items = Array.isArray(body?.items) ? body.items : [];
  const paperType = body?.paperType ? String(body.paperType).trim() : null;

  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Debe seleccionar al menos un producto para crear un kit" },
      { status: 400 }
    );
  }

  // normaliza y valida
  const norm = [];
  for (const it of items) {
    const productId = Number(it?.productId);
    const quantity = Math.max(1, Number(it?.quantity || 1));
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "productId inválido" }, { status: 400 });
    }
    norm.push({ productId, quantity });
  }

  //verifica que existan los productos
  const ids = norm.map((x) => x.productId);
  const found = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (found.length !== ids.length) {
    return NextResponse.json({ error: "Algún producto no existe" }, { status: 400 });
  }

  const created = await prisma.kit.create({
    data: {
      name,
      paperType,
      items: {
        create: norm.map((x) => ({ productId: x.productId, quantity: x.quantity })),
      },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true, price: true } } } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
