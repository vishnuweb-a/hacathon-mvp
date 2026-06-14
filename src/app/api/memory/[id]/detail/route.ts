/**
 * GET /api/memory/[id]/detail
 * Returns full Memory Detail View data (overview, content, evidence, usage, impact, timeline, related).
 */

import { NextRequest, NextResponse } from "next/server";
import { getMemoryDetail } from "@/services/memory/getMemoryDetail";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await getMemoryDetail(id);
    return NextResponse.json({ success: true, data: detail });
  } catch (error: any) {
    console.error("[GET /api/memory/:id/detail] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load memory detail" },
      { status: 500 }
    );
  }
}
