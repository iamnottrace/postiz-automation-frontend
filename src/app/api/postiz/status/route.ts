import { NextResponse } from "next/server";
import { postizClient } from "@/lib/postiz-client";

export async function GET() {
  try {
    const data = await postizClient.isConnected();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: error instanceof Error ? error.message : "Connection failed" },
      { status: 500 }
    );
  }
}
