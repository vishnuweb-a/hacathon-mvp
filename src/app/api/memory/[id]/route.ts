import { NextRequest, NextResponse } from "next/server";
import { retrieveMemoryById } from "@/services/memory/retrieveMemory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/memory/:id
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const memory = await retrieveMemoryById(id);

    return NextResponse.json({ success: true, memory }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/memory/:id] Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
