import { NextRequest, NextResponse } from "next/server";
import { buildContext } from "@/services/copilot/contextBuilder";
import { askGemini } from "@/services/copilot/geminiCopilot";
import { saveChatHistory } from "@/services/chatHistory";

export async function POST(request: NextRequest) {
  try {
    let body: { message?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'message' field" },
        { status: 400 }
      );
    }

    const { message } = body;

    console.log(`[Copilot API] Received message: "${message}"`);

    // Sequential Workflow:
    // 1-5. Build Context (Intent -> Recall -> Map -> Fetch Incidents -> Fetch Postmortems)
    const context = await buildContext(message);

    // 6. Gemini Integration
    const response = await askGemini(context);

    // 7. Save to Chat History
    await saveChatHistory(message, response);

    return NextResponse.json(
      { success: true, answer: response, sources: response.sources || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/copilot] Error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
