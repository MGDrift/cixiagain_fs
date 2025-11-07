
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

export async function POST(req) {
  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }
  const cat = await prisma.category.create({ data: { name: name.trim() } })
  return NextResponse.json(cat, { status: 201 })
}

/*
import { NextResponse } from "next/server";
import prisma from "@/libs/db"; // 👈 reusa el cliente que ya tienes

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req) {
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Nombre requerido" },
      { status: 400 }
    );
  }

  const cat = await prisma.category.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(cat, { status: 201 });
}
*/
