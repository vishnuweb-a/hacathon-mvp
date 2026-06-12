import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/health - Check Supabase connection
export async function GET() {
  try {
    const { error } = await supabase.from("incidents").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          supabase: "error",
          error: error.message,
          hint: error.hint ?? null,
          code: error.code ?? null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supabase: "connected",
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ set" : "❌ missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✅ set" : "❌ missing",
      },
    });
  } catch (error) {
    console.error("[GET /api/health] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
