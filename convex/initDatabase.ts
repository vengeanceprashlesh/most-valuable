import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize the database with default raffle configuration if none exists
 * This should be run once when setting up the system
 */
export const initializeDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if raffle config already exists
    const existingConfig = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (existingConfig) {
      return {
        success: true,
        message: "Raffle configuration already exists",
        config: existingConfig,
      };
    }

    // Create default raffle configuration
    const startDate = new Date(process.env.NEXT_PUBLIC_RAFFLE_START_DATE || "2025-08-18T00:00:00Z").getTime();
    const endDate = startDate + (22 * 24 * 60 * 60 * 1000); // 22 days from start

    const raffleId = await ctx.db.insert("raffleConfig", {
      name: "Most Valuable Raffle 2025",
      startDate,
      endDate,
      isActive: true,
      totalEntries: 0,
      pricePerEntry: 5000, // $50.00 in cents
      bundlePrice: 10000, // $100.00 in cents (4 entries for $100)
      bundleSize: 4,
      productName: "Most Valuable Raffle Entry",
      productDescription: "Enter to win amazing prizes from Most Valuable",
    });

    console.log("🎯 Database initialized with raffle configuration");
    
    return {
      success: true,
      message: "Database initialized successfully",
      raffleId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    };
  },
});

/**
 * Get current database status for admin
 */
export const getDatabaseStatus = query({
  args: {},
  handler: async (ctx) => {
    const raffleConfig = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    const totalEntries = await ctx.db.query("entries").collect();
    const completedEntries = totalEntries.filter(e => e.paymentStatus === "completed");
    const totalPaymentEvents = await ctx.db.query("paymentEvents").collect();
    const totalWinners = await ctx.db.query("raffleWinners").collect();

    return {
      hasRaffleConfig: !!raffleConfig,
      raffleConfig,
      stats: {
        totalEntries: totalEntries.length,
        completedEntries: completedEntries.length,
        totalPaymentEvents: totalPaymentEvents.length,
        totalWinners: totalWinners.length,
      },
      isInitialized: !!raffleConfig,
    };
  },
});

/**
 * Update raffle configuration (admin only)
 */
export const updateRaffleConfig = mutation({
  args: {
    adminToken: v.string(),
    name: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    pricePerEntry: v.optional(v.number()),
    bundlePrice: v.optional(v.number()),
    bundleSize: v.optional(v.number()),
    productName: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    totalEntries: v.optional(v.number()), // Added for sync functionality
  },
  handler: async (ctx, { adminToken, ...updates }) => {
    // Verify admin token
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      throw new Error("No active raffle configuration found");
    }

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(activeRaffle._id, cleanUpdates);

    return { 
      success: true, 
      message: "Raffle configuration updated successfully",
      updated: cleanUpdates,
    };
  },
});

/**
 * Sync raffle totalEntries with actual completed entries
 * This fixes sync issues between frontend and backend
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

/**
 * Reset database (dangerous - admin only, development use)
 */
export const resetDatabase = mutation({
  args: {
    adminToken: v.string(),
    confirmReset: v.string(), // Must be "CONFIRM_RESET_DATABASE"
  },
  handler: async (ctx, { adminToken, confirmReset }) => {
    // Verify admin token and confirmation
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    if (confirmReset !== "CONFIRM_RESET_DATABASE") {
      throw new Error("Invalid confirmation. Must provide 'CONFIRM_RESET_DATABASE'");
    }

    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      throw new Error("Database reset is not allowed in production");
    }

    // Clear all data (be very careful with this!)
    const tables = [
      "leads", "entries", "raffleConfig", "raffleWinners", 
      "raffleTickets", "paymentEvents", "adminNotifications", 
      "emailLogs", "errorLogs"
    ];

    let deletedCount = 0;

    for (const table of tables) {
      const items = await ctx.db.query(table as any).collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
        deletedCount++;
      }
    }

    console.log(`🗑️ Database reset: deleted ${deletedCount} records`);

    return {
      success: true,
      message: `Database reset successfully. Deleted ${deletedCount} records.`,
      deletedCount,
    };
  },
});
