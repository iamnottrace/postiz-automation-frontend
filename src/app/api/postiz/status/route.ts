import { NextResponse } from "next/server";
import { postizClient } from "@/lib/postiz-client";

export async function GET() {
  const baseUrl = process.env.POSTIZ_API_URL || "NOT_SET";
  const apiKey = process.env.POSTIZ_API_KEY ? "SET" : "NOT_SET";
  
  try {
    const data = await postizClient.isConnected();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        connected: false, 
        error: error instanceof Error ? error.message : "Connection failed",
        debug: { baseUrl, apiKey, cause: (error as any)?.cause?.message || "none" }
      },
      { status: 500 }
    );
  }
}
