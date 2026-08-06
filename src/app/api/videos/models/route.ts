import { NextResponse } from "next/server";
import { VIDEO_STYLE_PRESETS, VIDEO_MODELS } from "@/types/video";

export async function GET() {
  return NextResponse.json({
    styles: VIDEO_STYLE_PRESETS,
    models: VIDEO_MODELS,
  });
}
