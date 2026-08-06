import { NextRequest, NextResponse } from "next/server";
import { postizClient } from "@/lib/postiz-client";

export async function GET() {
  try {
    const data = await postizClient.listIntegrations();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list integrations" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await postizClient.deleteIntegration(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete integration" },
      { status: 500 }
    );
  }
}
