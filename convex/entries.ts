import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Add raffle entries for a user
 * This is typically called after successful payment
 */
export const addEntries = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    count: v.number(),
    amount: v.number(),
    stripePaymentIntent: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    bundle: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Invalid email format");
    }

    // Validate entry count
    if (args.count <= 0 || args.count > 100) {
      throw new Error("Invalid entry count. Must be between 1 and 100.");
    }

    // Validate amount (must be non-negative, 0 allowed for free entries)
    if (args.amount < 0) {
      throw new Error("Invalid amount. Must be non-negative.");
    }

    // For free entries (amount = 0), check if user already has a free entry
    if (args.amount === 0) {
      const existingFreeEntry = await ctx.db
        .query("entries")
        .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
        .filter((q) => q.eq(q.field("amount"), 0))
        .filter((q) => q.eq(q.field("paymentStatus"), "completed"))
        .first();
      
      if (existingFreeEntry) {
        throw new Error("User already has a free raffle entry. Only one free entry per email is allowed.");
      }
    }

    // Check if raffle is still active
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    const now = Date.now();
    // Use paymentStartDate for payment validation, startDate for timer display
    const paymentStart = activeRaffle.paymentStartDate || activeRaffle.startDate;
    if (now < paymentStart || now > activeRaffle.endDate) {
      throw new Error("Raffle is not currently accepting entries");
    }

    // Insert entry
    const entryId = await ctx.db.insert("entries", {
      ...args,
      email: args.email.toLowerCase(),
      paymentStatus: args.paymentStatus || "pending",
      createdAt: now,
    });

    // Update raffle total entries count
    if (args.paymentStatus === "completed") {
      await ctx.db.patch(activeRaffle._id, {
        totalEntries: activeRaffle.totalEntries + args.count
      });
    }

    return entryId;
  },
});

/**
 * Delete a specific entry by ID (admin only)
 */
export const deleteEntry = mutation({
  args: {
    entryId: v.id("entries"),
    adminToken: v.string(),
  },
  handler: async (ctx, { entryId, adminToken }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }
    
    const entry = await ctx.db.get(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }
    
    await ctx.db.delete(entryId);
    console.log(`🗑️ Deleted entry: ${entry.email} - ${entryId}`);
    
    return {
      success: true,
      deletedEntry: {
        id: entryId,
        email: entry.email,
        count: entry.count,
        amount: entry.amount
      }
    };
  },
});

/**
 * Update entry payment status
 * Called by webhook after payment confirmation
 */
export const updateEntryPaymentStatus = mutation({
  args: {
    stripeSessionId: v.string(),
    paymentStatus: v.string(),
    stripePaymentIntent: v.optional(v.string()),
  },
  handler: async (ctx, { stripeSessionId, paymentStatus, stripePaymentIntent }) => {
    const entry = await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", stripeSessionId))
      .first();

    if (!entry) {
      throw new Error("Entry not found for session ID: " + stripeSessionId);
    }

    // Update entry
    await ctx.db.patch(entry._id, {
      paymentStatus,
      stripePaymentIntent: stripePaymentIntent || entry.stripePaymentIntent,
    });

    // Update raffle total if status changed to completed
    if (paymentStatus === "completed" && entry.paymentStatus !== "completed") {
      const activeRaffle = await ctx.db
        .query("raffleConfig")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      if (activeRaffle) {
        await ctx.db.patch(activeRaffle._id, {
          totalEntries: activeRaffle.totalEntries + entry.count
        });
      }
    }

    return entry._id;
  },
});

/**
 * Get total entries for a specific email (completed payments only)
 */
export const totalEntriesByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const docs = await ctx.db
      .query("entries")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .filter((q) => q.eq(q.field("paymentStatus"), "completed"))
      .collect();
    return docs.reduce((sum, e) => sum + e.count, 0);
  },
});

/**
 * Get all entries for a specific email
 */
export const getEntriesByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .order("desc")
      .collect();
  },
});

/**
 * Get entry by ID
 */
export const getEntryById = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    return await ctx.db.get(entryId);
  },
});

/**
 * Get all completed entries (for winner selection)
 */
export const getCompletedEntries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();
  },
});

/**
 * Get all entries (admin function)
 */
export const getAllEntries = query({
  args: { 
    limit: v.optional(v.number()),
    cursor: v.optional(v.string())
  },
  handler: async (ctx, { limit = 50, cursor }) => {
    let query = ctx.db.query("entries").order("desc");
    
    if (cursor) {
      query = query.filter((q) => q.lt(q.field("createdAt"), parseInt(cursor)));
    }
    
    const entries = await query.take(limit);
    return {
      entries,
      nextCursor: entries.length === limit ? entries[entries.length - 1].createdAt.toString() : null
    };
  },
});

/**
 * Get raffle statistics
 */
export const getRaffleStats = query({
  args: {},
  handler: async (ctx) => {
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();

    const totalEntries = completedEntries.reduce((sum, e) => sum + e.count, 0);
    const totalRevenue = completedEntries.reduce((sum, e) => sum + e.amount, 0);
    const uniqueParticipants = new Set(completedEntries.map(e => e.email)).size;
    const bundlePurchases = completedEntries.filter(e => e.bundle).length;

    return {
      totalEntries,
      totalRevenue,
      uniqueParticipants,
      totalPurchases: completedEntries.length,
      bundlePurchases,
      averageEntriesPerPurchase: completedEntries.length > 0 ? totalEntries / completedEntries.length : 0
    };
  },
});

/**
 * Admin function to clean up duplicate free entries
 * Keeps the oldest entry for each email and removes newer duplicates
 */
export const cleanupDuplicateFreeEntries = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all free entries
    const allEntries = await ctx.db.query("entries").collect();
    const freeEntries = allEntries.filter(entry => entry.amount === 0 && entry.paymentStatus === "completed");
    
    // Group by email
    const emailGroups: Record<string, typeof freeEntries> = {};
    freeEntries.forEach(entry => {
      const email = entry.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(entry);
    });
    
    // Find and clean duplicates
    const duplicates = Object.entries(emailGroups).filter(([email, entries]) => entries.length > 1);
    let removedCount = 0;
    
    for (const [email, entries] of duplicates) {
      // Sort by creation time (oldest first)
      entries.sort((a, b) => a.createdAt - b.createdAt);
      
      // Keep the first (oldest), remove the rest
      const toRemove = entries.slice(1);
      
      for (const entry of toRemove) {
        await ctx.db.delete(entry._id);
        removedCount++;
        console.log(`🗑️ Removed duplicate free entry for ${email}: ${entry._id}`);
      }
    }
    
    return {
      duplicateEmailsFound: duplicates.length,
      entriesRemoved: removedCount,
      cleanedEmails: duplicates.map(([email]) => email)
    };
  },
});
