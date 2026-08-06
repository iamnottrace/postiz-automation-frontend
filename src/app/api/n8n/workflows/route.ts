import { NextRequest, NextResponse } from "next/server";
import { n8nClient } from "@/lib/n8n-client";

export async function GET() {
  try {
    const data = await n8nClient.listWorkflows();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list workflows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await n8nClient.createWorkflow(body);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create workflow" },
      { status: 500 }
    );
  }
}
