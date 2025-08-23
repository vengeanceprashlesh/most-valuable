import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fix sync issue between raffleConfig.totalEntries and actual completed entries
 * This mutation directly updates totalEntries to match reality
 */
export const syncRaffleTotals = mutation({
  args: {
    adminToken: v.string(),
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
      throw new Error("No active raffle configuration found");
    }

    // Get all completed entries and calculate actual total
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();

    const actualTotal = completedEntries.reduce((sum, entry) => sum + entry.count, 0);

    // Update raffleConfig.totalEntries to match actual total
    await ctx.db.patch(activeRaffle._id, {
      totalEntries: actualTotal,
    });

    console.log(`🔄 Synced raffleConfig.totalEntries from ${activeRaffle.totalEntries} to ${actualTotal}`);

    return {
      success: true,
      previousTotal: activeRaffle.totalEntries,
      newTotal: actualTotal,
      difference: activeRaffle.totalEntries - actualTotal,
      completedTransactions: completedEntries.length,
      message: `Successfully synced totalEntries to ${actualTotal}`,
    };
  },
});
