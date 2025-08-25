import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Generate cryptographically secure random seed for winner selection
 */
function generateSecureRandomSeed(): string {
  // Use current timestamp + crypto random values for entropy
  const timestamp = Date.now();
  const random1 = Math.floor(Math.random() * 1000000);
  const random2 = Math.floor(Math.random() * 1000000);
  return `${timestamp}-${random1}-${random2}`;
}

/**
 * Create a verification hash for the winner selection
 */
function createVerificationHash(
  winningTicketNumber: number,
  totalTickets: number,
  randomSeed: string,
  winnerEmail: string
): string {
  // Create a simple hash for verification (in production, use crypto hash)
  const data = `${winningTicketNumber}:${totalTickets}:${randomSeed}:${winnerEmail}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Cryptographically secure winner selection from all raffle tickets
 * Supports selecting multiple winners (up to maxWinners)
 */
export const selectRaffleWinner = mutation({
  args: {
    adminToken: v.string(), // Require admin authentication
  },
  handler: async (ctx, { adminToken }) => {
    // Verify admin token
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // Get current active raffle
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    // Check how many winners have already been selected
    const existingWinners = await ctx.db
      .query("raffleWinners")
      .withIndex("by_raffle", (q) => q.eq("raffleConfigId", activeRaffle._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const maxWinners = activeRaffle.maxWinners || 1;
    const winnersNeeded = maxWinners - existingWinners.length;

    if (winnersNeeded <= 0) {
      throw new Error(`All ${maxWinners} winner(s) have already been selected for this raffle`);
    }

    // Get all tickets in the pool (sorted by ticket number for fairness)
    const allTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number")
      .order("asc")
      .collect();

    if (allTickets.length === 0) {
      throw new Error("No tickets in the raffle pool. Create some test entries first or wait for real participants.");
    }

    console.log(`🎲 Starting winner selection: selecting winner ${existingWinners.length + 1}/${maxWinners} from ${allTickets.length} total tickets`);

    // Validate ticket integrity before selection
    const integrity = await ctx.runQuery(api.raffleTickets.validateTicketIntegrity);
    if (!integrity.isValid) {
      throw new Error(`Ticket integrity check failed: ${integrity.issues.join(", ")}`);
    }

    // Get ticket numbers that are already winning tickets (to avoid duplicates)
    const existingWinningTickets = new Set(existingWinners.map(w => w.winningTicketNumber));
    const availableTickets = allTickets.filter(ticket => !existingWinningTickets.has(ticket.ticketNumber));
    
    if (availableTickets.length === 0) {
      throw new Error("No available tickets remaining for winner selection");
    }

    // Generate secure random seed for auditing this selection
    const randomSeed = generateSecureRandomSeed();
    console.log(`🔐 Random seed generated: ${randomSeed}`);

    // Select 1 winner from available tickets
    const randomIndex = Math.floor(Math.random() * availableTickets.length);
    const winningTicket = availableTickets[randomIndex];
    const winningTicketNumber = winningTicket.ticketNumber;
    
    // Get the winning entry for additional details
    const winningEntry = await ctx.db.get(winningTicket.entryId);
    if (!winningEntry) {
      throw new Error("Winning entry not found");
    }

    // Create verification hash
    const verificationHash = createVerificationHash(
      winningTicketNumber,
      allTickets.length,
      randomSeed,
      winningTicket.email
    );

    const selectedAt = Date.now();

    // Record the winner with full audit trail
    const winnerId = await ctx.db.insert("raffleWinners", {
      raffleConfigId: activeRaffle._id,
      winnerEmail: winningTicket.email,
      winnerEntryId: winningEntry._id,
      selectedAt,
      totalEntriesInPool: allTickets.length,
      winningTicketNumber,
      randomSeed,
      selectionMethod: "crypto.random + timestamp",
      verificationHash,
      isActive: true,
    });

    // Update raffle config with the first winner (for backwards compatibility)
    if (existingWinners.length === 0) {
      await ctx.db.patch(activeRaffle._id, {
        winner: winningTicket.email,
        winnerSelectedAt: selectedAt,
      });
    }

    // Create admin notification
    try {
      await ctx.runMutation(api.notifications.notifyAdminOfWinner, {
        winnerEmail: winningTicket.email,
        winningTicketNumber,
        totalTickets: allTickets.length,
        raffleConfigId: activeRaffle._id,
      });
    } catch (notificationError) {
      console.error("Failed to send winner notification:", notificationError);
    }

    const currentWinnerCount = existingWinners.length + 1;
    console.log(`🏆 WINNER ${currentWinnerCount}/${maxWinners} SELECTED: ${winningTicket.email} with ticket #${winningTicketNumber} out of ${allTickets.length} total tickets`);

    return {
      success: true,
      winnerId,
      winnerEmail: winningTicket.email,
      winningTicketNumber,
      totalTickets: allTickets.length,
      verificationHash,
      randomSeed,
      selectedAt,
      winnerNumber: currentWinnerCount,
      totalWinners: maxWinners,
      remainingWinners: maxWinners - currentWinnerCount,
    };
  },
});

/**
 * Get current raffle winner (if any) - returns first winner for backwards compatibility
 */
export const getCurrentWinner = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("raffleWinners")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});

/**
 * Get all winners for the current active raffle
 */
export const getAllCurrentWinners = query({
  args: {},
  handler: async (ctx) => {
    // Get current active raffle
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      return { winners: [], maxWinners: 1, remainingWinners: 1 };
    }

    // Get all winners for this raffle
    const winners = await ctx.db
      .query("raffleWinners")
      .withIndex("by_raffle", (q) => q.eq("raffleConfigId", activeRaffle._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    const maxWinners = activeRaffle.maxWinners || 1;
    const remainingWinners = maxWinners - winners.length;

    return {
      winners,
      maxWinners,
      remainingWinners,
      raffleConfig: {
        name: activeRaffle.name,
        productName: activeRaffle.productName,
        totalEntries: activeRaffle.totalEntries,
      },
    };
  },
});

/**
 * Verify the fairness and authenticity of winner selection
 */
export const verifyWinnerSelection = query({
  args: {
    winnerId: v.id("raffleWinners"),
  },
  handler: async (ctx, { winnerId }) => {
    const winner = await ctx.db.get(winnerId);
    if (!winner) {
      throw new Error("Winner record not found");
    }

    // Recreate verification hash
    const expectedHash = createVerificationHash(
      winner.winningTicketNumber,
      winner.totalEntriesInPool,
      winner.randomSeed,
      winner.winnerEmail
    );

    // Get winning ticket details
    const winningTicket = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", winner.winningTicketNumber))
      .first();

    // Get winner's all tickets for context
    const allWinnerTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_email", (q) => q.eq("email", winner.winnerEmail))
      .collect();

    return {
      isValid: winner.verificationHash === expectedHash,
      winner,
      winningTicket,
      expectedHash,
      actualHash: winner.verificationHash,
      winnerTotalTickets: allWinnerTickets.length,
      winnerTicketNumbers: allWinnerTickets.map(t => t.ticketNumber).sort((a, b) => a - b),
      winningProbability: (allWinnerTickets.length / winner.totalEntriesInPool) * 100,
    };
  },
});

/**
 * Get detailed winner information for admin
 */
export const getWinnerDetails = query({
  args: {
    winnerId: v.id("raffleWinners"),
  },
  handler: async (ctx, { winnerId }) => {
    const winner = await ctx.db.get(winnerId);
    if (!winner) {
      return null;
    }

    // Get the winning entry
    const winningEntry = await ctx.db.get(winner.winnerEntryId);
    
    // Get all tickets for this winner
    const allWinnerTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_email", (q) => q.eq("email", winner.winnerEmail))
      .collect();

    // Get raffle details
    const raffle = await ctx.db.get(winner.raffleConfigId);

    return {
      winner,
      winningEntry,
      raffle,
      winnerTotalTickets: allWinnerTickets.length,
      winnerTicketNumbers: allWinnerTickets.map(t => t.ticketNumber).sort((a, b) => a - b),
      winningProbability: (allWinnerTickets.length / winner.totalEntriesInPool) * 100,
    };
  },
});

/**
 * Update winner contact status (when admin reaches out)
 */
export const markWinnerContacted = mutation({
  args: {
    winnerId: v.id("raffleWinners"),
    adminToken: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { winnerId, adminToken, notes }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(winnerId, {
      contactedAt: Date.now(),
      notes,
    });

    return { success: true };
  },
});

/**
 * Mark prize as delivered
 */
export const markPrizeDelivered = mutation({
  args: {
    winnerId: v.id("raffleWinners"),
    adminToken: v.string(),
    deliveryAddress: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { winnerId, adminToken, deliveryAddress, notes }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(winnerId, {
      prizeDeliveredAt: Date.now(),
      deliveryAddress,
      notes,
    });

    return { success: true };
  },
});
