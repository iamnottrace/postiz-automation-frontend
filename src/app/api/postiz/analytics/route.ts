import { NextRequest, NextResponse } from "next/server";
import { postizClient } from "@/lib/postiz-client";

export async function GET(req: NextRequest) {
  try {
    const integrationId = req.nextUrl.searchParams.get("integrationId");
    if (!integrationId) {
      return NextResponse.json({ error: "integrationId required" }, { status: 400 });
    }
    const data = await postizClient.getAnalytics(integrationId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get analytics" },
      { status: 500 }
    );
  }
}
