import { NextRequest, NextResponse } from "next/server";
import { n8nClient } from "@/lib/n8n-client";

export async function PATCH(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (action === "activate") {
      const data = await n8nClient.activateWorkflow(id);
      return NextResponse.json(data);
    } else if (action === "deactivate") {
      const data = await n8nClient.deactivateWorkflow(id);
      return NextResponse.json(data);
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await n8nClient.deleteWorkflow(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
