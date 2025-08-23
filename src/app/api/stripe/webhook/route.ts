import { NextResponse } from "next/server";

// This endpoint is deprecated. Please use /api/webhooks/stripe instead.
// This endpoint does NOT process payments properly.
export async function POST() {
  return NextResponse.json(
    { 
      error: "This webhook endpoint is deprecated. Use /api/webhooks/stripe instead.",
      status: "deprecated" 
    },
    { status: 410 } // Gone
  );
}

export async function GET() {
  return NextResponse.json(
    { 
      error: "This webhook endpoint is deprecated. Use /api/webhooks/stripe instead.",
      status: "deprecated" 
    },
    { status: 410 } // Gone
  );
}
