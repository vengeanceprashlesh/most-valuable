import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    
    // Get raffle status from Convex
    const raffleStatus = await convex.query(api.raffleWinner.getRaffleStatus);

    // Normalize and guarantee JSON shape with safe defaults
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rs: any = raffleStatus ?? {};
    const endDate = Number(rs.endDate ?? now);
    const hasEnded = Boolean(rs.hasEnded ?? endDate <= now);
    const hasWinner = Boolean(rs.hasWinner ?? false);
    const totalUniqueLeads = Number(rs.totalUniqueLeads ?? 0);
    const timeRemaining = Math.max(0, endDate - now);

    return NextResponse.json({
      hasEnded,
      endDate,
      hasWinner,
      totalUniqueLeads,
      timeRemaining,
    });
  } catch (error) {
    console.error("Error fetching raffle status:", error);
    return NextResponse.json(
      { error: "Failed to fetch raffle status" },
      { status: 500 }
    );
  }
}
