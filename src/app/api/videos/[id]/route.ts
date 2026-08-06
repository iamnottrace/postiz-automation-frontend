import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { videoClient } from "@/lib/video-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.videoProject.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (video.ppqJobId && (video.status === "processing" || video.status === "pending")) {
      try {
        const status = await videoClient.getVideoStatus(video.ppqJobId);
        if (status.status === "completed" && status.data?.url) {
          const updated = await prisma.videoProject.update({
            where: { id },
            data: {
              status: "completed",
              videoUrl: status.data.url,
              cost: status.cost ?? video.cost,
            },
            include: { character: true },
          });
          return NextResponse.json(updated);
        } else if (status.status === "failed") {
          const updated = await prisma.videoProject.update({
            where: { id },
            data: { status: "failed" },
            include: { character: true },
          });
          return NextResponse.json(updated);
        }
      } catch {
        // Return current state if polling fails
      }
    }

    const current = await prisma.videoProject.findUnique({
      where: { id },
      include: { character: true },
    });
    return NextResponse.json(current);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.videoProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
