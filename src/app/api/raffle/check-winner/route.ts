import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export async function POST() {
  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Check and select winner if raffle has ended
    const result = await convex.action(api.raffleActions.checkAndSelectWinner);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking for winner:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to check for winner",
        winner: null,
        alreadySelected: false
      },
      { status: 500 }
    );
  }
}
