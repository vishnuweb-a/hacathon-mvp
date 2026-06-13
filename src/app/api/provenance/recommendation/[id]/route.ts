import { NextResponse } from "next/server";
import { getEvidenceChain } from "@/services/provenance/getEvidenceChain";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if the id is an intelligence report ID, otherwise default to analysis
    // In a real app we'd have explicit typing, but for MVP we infer from context
    const url = new URL(request.url);
    const typeParam = url.searchParams.get("type");
    
    let targetType: any = "analysis";
    if (typeParam === "intelligence") targetType = "intelligence";
    if (typeParam === "report") targetType = "report";

    const chain = await getEvidenceChain(targetType, id);

    return NextResponse.json({ success: true, data: chain });
  } catch (error) {
    console.error("[GET /api/provenance/recommendation] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
