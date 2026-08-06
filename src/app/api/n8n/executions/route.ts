import { NextRequest, NextResponse } from "next/server";
import { n8nClient } from "@/lib/n8n-client";

export async function GET(req: NextRequest) {
  try {
    const workflowId = req.nextUrl.searchParams.get("workflowId");
    const limit = req.nextUrl.searchParams.get("limit") || "20";
    const data = await n8nClient.listExecutions(workflowId || undefined, parseInt(limit));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list executions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { workflowId, data } = await req.json();
    const result = await n8nClient.triggerExecution(workflowId, data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger execution" },
      { status: 500 }
    );
  }
}
