import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { videoClient } from "@/lib/video-client";
import type { VideoModel } from "@/types/video";

export async function GET() {
  try {
    const videos = await prisma.videoProject.findMany({
      include: { character: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(videos);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, aspectRatio, duration, quality, characterId, productImageUrl, name, postText } = body;

    if (!prompt || !model) {
      return NextResponse.json({ error: "prompt and model are required" }, { status: 400 });
    }

    const isImageToVideo = model.includes("i2v");
    const imageUrl = productImageUrl || (isImageToVideo ? undefined : undefined);

    const result = await videoClient.submitVideo({
      model: model as VideoModel,
      prompt,
      aspect_ratio: aspectRatio || "16:9",
      duration: duration || "5",
      quality,
      image_url: imageUrl,
    });

    const video = await prisma.videoProject.create({
      data: {
        name: name || `Video ${new Date().toLocaleString()}`,
        characterId: characterId || null,
        productImageUrl: productImageUrl || null,
        prompt,
        model,
        aspectRatio: aspectRatio || "16:9",
        duration: duration || "5",
        quality: quality || null,
        status: "processing",
        ppqJobId: result.id,
        cost: result.estimated_cost,
        postText: postText || null,
      },
    });

    return NextResponse.json({ video, jobId: result.id });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
