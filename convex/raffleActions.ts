"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Types for winner selection
interface WinnerResult {
  success: boolean;
  message: string;
  winner: {
    email: string;
    selectedAt: number;
    totalLeadsCount: number;
    selectionIndex?: number;
    winnerId?: any;
  } | null;
  alreadySelected: boolean;
  error?: string;
}

/**
 * Automated winner selection action
 * Uses crypto.randomInt for cryptographically secure random selection
 * Only selects a winner if:
 * 1. Raffle has ended
 * 2. No winner has been selected yet
 * 3. There are leads to select from
 */
export const selectWinner = action({
  args: {
    forceSelection: v.optional(v.boolean()), // For admin/testing purposes
  },
  handler: async (ctx, { forceSelection = false }): Promise<WinnerResult> => {
    // Get raffle status
    const raffleStatus = await ctx.runQuery(api.raffleWinner.getRaffleStatus);
    
    // Validation: Only select if raffle has ended (unless forced)
    if (!raffleStatus.hasEnded && !forceSelection) {
      throw new Error("Raffle has not ended yet. Winner selection is not available.");
    }

    // Check if winner already exists
    if (raffleStatus.hasWinner) {
      const existingWinner = await ctx.runQuery(api.raffleWinner.getCurrentWinner);
      return {
        success: true,
        message: "Winner already selected",
        winner: {
          email: existingWinner!.winnerEmail,
          selectedAt: existingWinner!.selectedAt,
          totalLeadsCount: existingWinner!.totalLeadsCount,
        },
        alreadySelected: true,
      };
    }

    // Get all unique lead emails
    const leadsData = await ctx.runQuery(api.raffleWinner.getUniqueLeadEmails);
    
    // Validation: Must have leads to select from
    if (leadsData.count === 0) {
      throw new Error("No leads available for winner selection. Raffle ended with no participants.");
    }

    // Cryptographically secure random selection using Node.js crypto
    const crypto = await import("crypto");
    const randomIndex = crypto.randomInt(0, leadsData.emails.length);
    const selectedEmail = leadsData.emails[randomIndex];

    // Store the winner
    const winnerId = await ctx.runMutation(api.raffleWinner.storeWinner, {
      winnerEmail: selectedEmail,
      raffleEndDate: raffleStatus.endDate,
      totalLeadsCount: leadsData.count,
    });

    console.log(`🎉 WINNER SELECTED: ${selectedEmail} (${randomIndex + 1}/${leadsData.count})`);

    return {
      success: true,
      message: "Winner successfully selected!",
      winner: {
        email: selectedEmail,
        selectedAt: Date.now(),
        totalLeadsCount: leadsData.count,
        selectionIndex: randomIndex,
        winnerId,
      },
      alreadySelected: false,
    };
  },
});

/**
 * Check if winner should be selected and trigger selection
 * This can be called from frontend or via scheduled job
 */
export const checkAndSelectWinner = action({
  args: {},
  handler: async (ctx): Promise<WinnerResult> => {
    try {
      const result = await ctx.runAction(api.raffleActions.selectWinner, {
        forceSelection: false,
      });
      return result;
    } catch (error) {
      // Return error info instead of throwing to handle gracefully in UI
      return {
        success: false,
        message: "Failed to select winner",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        winner: null,
        alreadySelected: false,
      };
    }
  },
});

/**
 * Admin function to force winner selection (for testing/debugging)
 */
export const forceSelectWinner = action({
  args: {},
  handler: async (ctx): Promise<WinnerResult> => {
    return await ctx.runAction(api.raffleActions.selectWinner, {
      forceSelection: true,
    });
  },
});
