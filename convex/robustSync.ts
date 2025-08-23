import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ROBUST SYNC SYSTEM - This prevents and fixes frontend/backend sync issues
 * 
 * The problem: raffleConfig.totalEntries can get out of sync with actual completed entries
 * The solution: Always calculate totals dynamically from actual data
 */

/**
 * Get REAL raffle statistics by calculating from actual completed entries
 * This ensures frontend always shows correct data regardless of sync issues
 */
export const getRealRaffleStats = query({
  args: {},
  handler: async (ctx) => {
    // Get raffle config
    const raffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!raffle) {
      return null;
    }

    // Get ALL completed entries to calculate REAL totals
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();

    // Calculate REAL total from actual completed entries
    const realTotalEntries = completedEntries.reduce((sum, entry) => sum + entry.count, 0);
    const realTotalRevenue = completedEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const realUniqueParticipants = new Set(completedEntries.map(e => e.email)).size;

    // Return raffle config with CORRECTED totals
    return {
      // Basic raffle info
      name: raffle.name,
      startDate: raffle.startDate,
      endDate: raffle.endDate,
      isActive: raffle.isActive,
      pricePerEntry: raffle.pricePerEntry,
      bundlePrice: raffle.bundlePrice,
      bundleSize: raffle.bundleSize,
      productName: raffle.productName,
      productDescription: raffle.productDescription,
      hasWinner: !!raffle.winner,
      
      // REAL statistics (calculated from actual data)
      totalEntries: realTotalEntries, // This is the REAL count
      totalRevenue: realTotalRevenue,
      uniqueParticipants: realUniqueParticipants,
      
      // Sync status info
      syncStatus: {
        storedTotal: raffle.totalEntries,
        realTotal: realTotalEntries,
        needsSync: raffle.totalEntries !== realTotalEntries,
        difference: raffle.totalEntries - realTotalEntries,
      },
    };
  },
});

/**
 * Auto-fix sync issues when detected
 * This can be called from the frontend automatically
 */
export const autoFixSyncIssues = mutation({
  args: {},
  handler: async (ctx) => {
    // Get active raffle
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      return { success: false, error: "No active raffle found" };
    }

    // Calculate real total
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();

    const realTotal = completedEntries.reduce((sum, entry) => sum + entry.count, 0);

    // Check if sync is needed
    if (activeRaffle.totalEntries === realTotal) {
      return { 
        success: true, 
        message: "Already in sync", 
        totalEntries: realTotal,
        syncNeeded: false 
      };
    }

    // Auto-fix the sync issue
    await ctx.db.patch(activeRaffle._id, {
      totalEntries: realTotal,
    });

    console.log(`🔧 Auto-fixed sync: ${activeRaffle.totalEntries} → ${realTotal}`);

    return {
      success: true,
      message: "Sync issue auto-fixed",
      previousTotal: activeRaffle.totalEntries,
      newTotal: realTotal,
      syncNeeded: true,
      fixed: true,
    };
  },
});
