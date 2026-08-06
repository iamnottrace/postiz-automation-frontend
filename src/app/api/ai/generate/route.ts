import { NextRequest, NextResponse } from "next/server";
import { aiClient } from "@/lib/ai-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await aiClient.generate(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate content" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ configured: aiClient.isConfigured() });
}
