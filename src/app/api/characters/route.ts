import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const characters = await prisma.character.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { videos: true } } },
    });
    return NextResponse.json(characters);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, imageUrl, description, stylePreset } = body;

    if (!name || !imageUrl) {
      return NextResponse.json({ error: "name and imageUrl are required" }, { status: 400 });
    }

    const character = await prisma.character.create({
      data: { name, imageUrl, description, stylePreset },
    });
    return NextResponse.json(character);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
