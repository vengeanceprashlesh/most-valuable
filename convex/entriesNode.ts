"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";
import { api } from "./_generated/api";

/**
 * Securely select a random winner from all completed entries
 * Uses Node.js crypto module for cryptographically secure randomness
 */
export const selectWinner: any = action({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // Get active raffle
    const activeRaffle = await ctx.runQuery(api.payments.getRaffleConfigInternal);

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    // Check if raffle has ended
    const now = Date.now();
    if (now < activeRaffle.endDate) {
      throw new Error("Raffle has not ended yet");
    }

    // Check if winner already selected
    if (activeRaffle.winner) {
      return {
        winner: activeRaffle.winner,
        totalEntries: activeRaffle.totalEntries,
        alreadySelected: true,
        selectedAt: activeRaffle.winnerSelectedAt
      };
    }

    // Get all completed entries
    const entries = await ctx.runQuery(api.entries.getCompletedEntries);

    if (entries.length === 0) {
      throw new Error("No completed entries found");
    }

    // Create the entry bag (each entry appears count times)
    const entryBag: { email: string; entryNumber: number }[] = [];
    let entryNumber = 1;
    
    for (const entry of entries) {
      for (let i = 0; i < entry.count; i++) {
        entryBag.push({
          email: entry.email,
          entryNumber: entryNumber++
        });
      }
    }

    // Support multiple winners (default to 1 if not specified)
    const maxWinners = activeRaffle.maxWinners || 1;
    const winners: { email: string; entryNumber: number }[] = [];
    const usedIndices = new Set<number>();
    
    // Select multiple winners without replacement
    for (let i = 0; i < maxWinners && winners.length < entryBag.length; i++) {
      let randomIndex: number;
      do {
        randomIndex = crypto.randomInt(0, entryBag.length);
      } while (usedIndices.has(randomIndex));
      
      usedIndices.add(randomIndex);
      winners.push(entryBag[randomIndex]);
    }

    // Update raffle with first winner (for backwards compatibility)
    const winnerSelectedAt = Date.now();
    const primaryWinner = winners[0].email;
    
    await ctx.runMutation(api.raffleMutations.updateRaffleWinner, {
      raffleId: activeRaffle._id!,
      winner: primaryWinner,
      winnerSelectedAt,
    });

    // Log all winner selections for audit purposes
    console.log(`Selected ${winners.length} winner(s):`);
    winners.forEach((winner, index) => {
      console.log(`  Winner ${index + 1}: ${winner.email}, Entry #${winner.entryNumber}`);
    });
    console.log(`Selected at: ${new Date(winnerSelectedAt).toISOString()}`);

    return {
      winner: primaryWinner, // Primary winner for backwards compatibility
      winners: winners, // All winners
      totalEntries: entryBag.length,
      winningEntryNumbers: winners.map(w => w.entryNumber),
      selectedAt: winnerSelectedAt,
      uniqueParticipants: new Set(entries.map((e: any) => e.email)).size,
      alreadySelected: false
    };
  },
});

/**
 * Initialize or update raffle configuration
 */
export const setupRaffle: any = action({
  args: {
    adminToken: v.string(),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    timerDisplayDate: v.optional(v.number()), // When timer should start displaying (for UI)
    paymentStartDate: v.optional(v.number()), // When payments should be accepted
    pricePerEntry: v.number(), // in cents
    bundlePrice: v.number(), // in cents
    bundleSize: v.number(),
    productName: v.string(),
    productDescription: v.optional(v.string()),
    maxWinners: v.optional(v.number()), // Number of winners to select
  },
  handler: async (ctx, { adminToken, ...config }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // Validate dates
    if (config.startDate >= config.endDate) {
      throw new Error("Start date must be before end date");
    }

    if (config.endDate <= Date.now()) {
      throw new Error("End date must be in the future");
    }

    // Validate pricing
    if (config.pricePerEntry <= 0 || config.bundlePrice <= 0) {
      throw new Error("Prices must be positive");
    }

    if (config.bundleSize <= 1) {
      throw new Error("Bundle size must be greater than 1");
    }

    // Check for existing active raffle
    const existingRaffle = await ctx.runQuery(api.payments.getRaffleConfigInternal);

    if (existingRaffle) {
      // Update existing raffle
      return await ctx.runMutation(api.raffleMutations.updateRaffleConfig, {
        raffleId: existingRaffle._id!,
        ...config,
      });
    } else {
      // Create new raffle
      return await ctx.runMutation(api.raffleMutations.createRaffleConfig, {
        ...config,
      });
    }
  },
});

/**
 * Get current raffle configuration
 */
export const getCurrentRaffle: any = action({
  args: {},
  handler: async (ctx) => {
    return await ctx.runQuery(api.payments.getRaffleConfigInternal);
  },
});

/**
 * End raffle early (admin function)
 */
export const endRaffle = action({
  args: { adminToken: v.string() },
  handler: async (ctx, { adminToken }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    const activeRaffle = await ctx.runQuery(api.payments.getRaffleConfigInternal);

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    await ctx.runMutation(api.raffleMutations.updateRaffleConfig, {
      raffleId: activeRaffle._id!,
      isActive: false,
      endDate: Date.now()
    });

    return { success: true, endedAt: Date.now() };
  },
});

/**
 * Extend raffle end date (admin function)
 */
export const extendRaffle = action({
  args: { 
    adminToken: v.string(),
    newEndDate: v.number()
  },
  handler: async (ctx, { adminToken, newEndDate }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    if (newEndDate <= Date.now()) {
      throw new Error("New end date must be in the future");
    }

    const activeRaffle = await ctx.runQuery(api.payments.getRaffleConfigInternal);

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    if (activeRaffle.winner) {
      throw new Error("Cannot extend raffle after winner has been selected");
    }

    await ctx.runMutation(api.raffleMutations.updateRaffleConfig, {
      raffleId: activeRaffle._id!,
      endDate: newEndDate
    });

    return { success: true, newEndDate };
  },
});

/**
 * Send winner notification email (placeholder - implement with actual email service)
 */
export const notifyWinner = action({
  args: { 
    adminToken: v.string(),
    winnerEmail: v.string()
  },
  handler: async (ctx, { adminToken, winnerEmail }) => {
    // Verify admin authorization
    if (adminToken !== process.env.ADMIN_TOKEN) {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // Here you would implement actual email sending logic
    // For now, we'll just log and return success
    console.log(`Sending winner notification to: ${winnerEmail}`);
    
    // TODO: Implement actual email sending with SendGrid, Nodemailer, etc.
    // const emailResult = await sendEmail({
    //   to: winnerEmail,
    //   subject: "Congratulations! You've won the Most Valuable Raffle!",
    //   template: "winner-notification",
    //   data: { winnerEmail }
    // });

    return { 
      success: true, 
      message: `Winner notification queued for ${winnerEmail}`,
      timestamp: Date.now()
    };
  },
});
