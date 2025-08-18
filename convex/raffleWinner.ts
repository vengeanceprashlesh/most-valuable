import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { addDays, isAfter, parseISO } from "date-fns";
import { api } from "./_generated/api";

// Types for raffle system
interface RaffleStatus {
  startDate: number;
  endDate: number;
  currentTime: number;
  hasEnded: boolean;
  hasWinner: boolean;
  winnerEmail: string | null;
  winnerSelectedAt: number | null;
  totalUniqueLeads: number;
  timeRemaining: number;
}

interface LeadEmails {
  emails: string[];
  count: number;
}

interface RaffleStats {
  raffleStatus: RaffleStatus;
  totalWinnersEverSelected: number;
  totalLeadsAllTime: number;
  allWinners: Array<{
    email: string;
    selectedAt: number;
    isActive: boolean;
    totalLeadsAtTime: number;
  }>;
  recentLeads: Array<{
    email: string;
    createdAt: number;
    source?: string;
  }>;
}

/**
 * Get raffle timer status and configuration
 * Calculates countdown from environment variable start date + 22 days
 */
export const getRaffleStatus = query({
  args: {},
  handler: async (ctx) => {
    // Get start date from environment variable or default to current date
    const startDateStr = process.env.NEXT_PUBLIC_RAFFLE_START_DATE || "2025-08-18T00:00:00Z";
    const startDate = parseISO(startDateStr);
    
    // Calculate end date (start + 22 days)
    const endDate = addDays(startDate, 22);
    const now = new Date();
    
    // Check if raffle has ended
    const hasEnded = isAfter(now, endDate);
    
    // Get current winner if exists
    const activeWinner = await ctx.db
      .query("winners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    // Get total unique leads count
    const allLeads = await ctx.db.query("leads").collect();
    const uniqueLeadsCount = allLeads.length;
    
    return {
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      currentTime: now.getTime(),
      hasEnded,
      hasWinner: !!activeWinner,
      winnerEmail: activeWinner?.winnerEmail || null,
      winnerSelectedAt: activeWinner?.selectedAt || null,
      totalUniqueLeads: uniqueLeadsCount,
      timeRemaining: hasEnded ? 0 : endDate.getTime() - now.getTime(),
    };
  },
});

/**
 * Get all unique email addresses from leads for winner selection
 * This is a helper query for the winner selection process
 */
export const getUniqueLeadEmails = query({
  args: {},
  handler: async (ctx) => {
    const allLeads = await ctx.db.query("leads").collect();
    
    // Extract unique emails (leads table already enforces uniqueness via index)
    const uniqueEmails = allLeads.map(lead => lead.email);
    
    return {
      emails: uniqueEmails,
      count: uniqueEmails.length,
    };
  },
});

/**
 * Store the selected winner in the winners table
 * This mutation ensures only one active winner exists at a time
 */
export const storeWinner = mutation({
  args: {
    winnerEmail: v.string(),
    raffleEndDate: v.number(),
    totalLeadsCount: v.number(),
  },
  handler: async (ctx, { winnerEmail, raffleEndDate, totalLeadsCount }) => {
    // First, deactivate any existing active winners
    const existingWinners = await ctx.db
      .query("winners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    for (const winner of existingWinners) {
      await ctx.db.patch(winner._id, { isActive: false });
    }

    // Store the new winner
    const winnerId = await ctx.db.insert("winners", {
      winnerEmail,
      selectedAt: Date.now(),
      raffleEndDate,
      totalLeadsCount,
      selectionMethod: "crypto.randomInt",
      isActive: true,
    });

    return winnerId;
  },
});

/**
 * Get the current active winner
 */
export const getCurrentWinner = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("winners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

// Actions moved to raffleActions.ts to support Node.js runtime for crypto operations

/**
 * Get raffle statistics for admin/debugging
 */
export const getRaffleStats = query({
  args: {},
  handler: async (ctx): Promise<RaffleStats> => {
    const raffleStatus = await ctx.runQuery(api.raffleWinner.getRaffleStatus);
    const allWinners = await ctx.db.query("winners").order("desc").collect();
    const allLeads = await ctx.db.query("leads").order("desc").collect();

    return {
      raffleStatus,
      totalWinnersEverSelected: allWinners.length,
      totalLeadsAllTime: allLeads.length,
      allWinners: allWinners.map(w => ({
        email: w.winnerEmail,
        selectedAt: w.selectedAt,
        isActive: w.isActive,
        totalLeadsAtTime: w.totalLeadsCount,
      })),
      recentLeads: allLeads.slice(0, 10).map(l => ({
        email: l.email,
        createdAt: l.createdAt,
        source: l.source,
      })),
    };
  },
});
