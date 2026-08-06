import { NextRequest, NextResponse } from "next/server";
import { postizClient } from "@/lib/postiz-client";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const data = await postizClient.uploadMedia(file);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload media" },
      { status: 500 }
    );
  }
}
