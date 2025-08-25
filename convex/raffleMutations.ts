import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Update raffle winner information
 */
export const updateRaffleWinner = mutation({
  args: {
    raffleId: v.id("raffleConfig"),
    winner: v.string(),
    winnerSelectedAt: v.number(),
  },
  handler: async (ctx, { raffleId, winner, winnerSelectedAt }) => {
    return await ctx.db.patch(raffleId, {
      winner,
      winnerSelectedAt,
      isActive: false,
    });
  },
});

/**
 * Update raffle configuration
 */
export const updateRaffleConfig = mutation({
  args: {
    raffleId: v.id("raffleConfig"),
    name: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    timerDisplayDate: v.optional(v.number()),
    paymentStartDate: v.optional(v.number()),
    pricePerEntry: v.optional(v.number()),
    bundlePrice: v.optional(v.number()),
    bundleSize: v.optional(v.number()),
    productName: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    totalEntries: v.optional(v.number()),
    maxWinners: v.optional(v.number()),
  },
  handler: async (ctx, { raffleId, ...updates }) => {
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    return await ctx.db.patch(raffleId, cleanUpdates);
  },
});

/**
 * Create new raffle configuration
 */
export const createRaffleConfig = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    timerDisplayDate: v.optional(v.number()),
    paymentStartDate: v.optional(v.number()),
    pricePerEntry: v.number(),
    bundlePrice: v.number(),
    bundleSize: v.number(),
    productName: v.string(),
    productDescription: v.optional(v.string()),
    maxWinners: v.optional(v.number()),
  },
  handler: async (ctx, config) => {
    return await ctx.db.insert("raffleConfig", {
      ...config,
      isActive: true,
      totalEntries: 0,
    });
  },
});
