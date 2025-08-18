import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export async function POST() {
  try {
    // Only allow in development mode for security
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Force selection only available in development mode" },
        { status: 403 }
      );
    }

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Force select winner for testing/admin purposes
    const result = await convex.action(api.raffleActions.forceSelectWinner);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error forcing winner selection:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to force select winner",
        winner: null,
        alreadySelected: false
      },
      { status: 500 }
    );
  }
}
