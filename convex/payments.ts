import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Create a pending entry before Stripe checkout
 * This will be updated after successful payment
 */
export const createPendingEntry = mutation({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    count: v.number(),
    bundle: v.optional(v.boolean()),
    stripeSessionId: v.string(),
    ipAddress: v.optional(v.string()),
    // Product selection parameters
    productId: v.optional(v.string()),
    variantId: v.optional(v.string()),
    selectedColor: v.optional(v.string()),
    selectedSize: v.optional(v.string()),
  },
  handler: async (ctx, { email, phone, count, bundle, stripeSessionId, ipAddress, productId, variantId, selectedColor, selectedSize }) => {
    // Normalize optional email
    const normalizedEmail = email ? email.toLowerCase() : "";

    if (count <= 0 || count > 100) {
      throw new Error("Invalid entry count");
    }

    // Get active raffle to determine pricing
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!activeRaffle) {
      throw new Error("No active raffle found");
    }

    // Check if raffle is accepting entries (use paymentStartDate for payments)
    const now = Date.now();
    const paymentStart = activeRaffle.paymentStartDate || activeRaffle.startDate;
    
    // For payments: check paymentStartDate vs endDate
    // This allows payments to work even if timer hasn't started yet
    if (now < paymentStart || now > activeRaffle.endDate) {
      throw new Error("Raffle is not currently accepting entries");
    }

    // Calculate amount based on bundle or individual pricing
    let amount: number;
    if (bundle && count === activeRaffle.bundleSize) {
      amount = activeRaffle.bundlePrice;
    } else {
      amount = count * activeRaffle.pricePerEntry;
    }

    // Create pending entry
    return await ctx.db.insert("entries", {
      email: normalizedEmail,
      phone,
      count,
      amount,
      stripeSessionId,
      paymentStatus: "pending",
      bundle: bundle || false,
      ipAddress,
      // Product selection data
      productId,
      variantId,
      variantColor: selectedColor,
      size: selectedSize,
      createdAt: now,
    });
  },
});

/**
 * Handle successful payment webhook
 */
export const handlePaymentSuccess = mutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntent: v.string(),
    webhookEventId: v.string(),
  },
  handler: async (ctx, { stripeSessionId, stripePaymentIntent, webhookEventId }) => {
    // Check if this webhook has already been processed
    const existingEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", webhookEventId))
      .first();

    if (existingEvent?.processed) {
      console.log(`Webhook ${webhookEventId} already processed`);
      return { success: true, alreadyProcessed: true };
    }

    // Find the pending entry
    const entry = await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", stripeSessionId))
      .first();

    if (!entry) {
      throw new Error(`Entry not found for session: ${stripeSessionId}`);
    }

    if (entry.paymentStatus === "completed") {
      console.log(`Entry ${entry._id} already completed`);
      return { success: true, alreadyCompleted: true };
    }

    // Update entry status
    await ctx.db.patch(entry._id, {
      paymentStatus: "completed",
      stripePaymentIntent,
    });

    // Update raffle total entries
    const activeRaffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (activeRaffle) {
      await ctx.db.patch(activeRaffle._id, {
        totalEntries: activeRaffle.totalEntries + entry.count,
      });
    }

    // Log the webhook event
    await ctx.db.insert("paymentEvents", {
      eventType: "payment_succeeded",
      stripeEventId: webhookEventId,
      paymentIntent: stripePaymentIntent,
      sessionId: stripeSessionId,
      email: entry.email,
      amount: entry.amount,
      status: "completed",
      rawData: JSON.stringify({ stripeSessionId, stripePaymentIntent }),
      processed: true,
      createdAt: Date.now(),
    });

    console.log(`Payment completed for ${entry.email}: ${entry.count} entries`);

    // Assign raffle tickets for this completed entry
    try {
      await ctx.runMutation(api.raffleTickets.assignTicketsToEntry, {
        entryId: entry._id,
      });
      console.log(`🎫 Assigned ${entry.count} raffle tickets to ${entry.email}`);
    } catch (ticketError) {
      console.error('Failed to assign raffle tickets:', ticketError);
      // Don't fail the payment processing if ticket assignment fails
    }

    // Notify admin of new order
    try {
      await ctx.runMutation(api.notifications.notifyAdminOfNewOrder, {
        entryId: entry._id,
        email: entry.email,
        count: entry.count,
        amount: entry.amount,
        stripeSessionId,
      });
    } catch (notificationError) {
      console.error('Failed to send admin notification:', notificationError);
      // Don't fail the payment processing if notification fails
    }

    return { 
      success: true, 
      entryId: entry._id,
      email: entry.email,
      count: entry.count 
    };
  },
});

/**
 * Handle failed payment webhook
 */
export const handlePaymentFailure = mutation({
  args: {
    stripeSessionId: v.string(),
    webhookEventId: v.string(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { stripeSessionId, webhookEventId, errorMessage }) => {
    // Check if this webhook has already been processed
    const existingEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", webhookEventId))
      .first();

    if (existingEvent?.processed) {
      console.log(`Webhook ${webhookEventId} already processed`);
      return { success: true, alreadyProcessed: true };
    }

    // Find the pending entry
    const entry = await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", stripeSessionId))
      .first();

    if (!entry) {
      console.log(`Entry not found for session: ${stripeSessionId}`);
      return { success: true, entryNotFound: true };
    }

    // Update entry status
    await ctx.db.patch(entry._id, {
      paymentStatus: "failed",
    });

    // Log the webhook event
    await ctx.db.insert("paymentEvents", {
      eventType: "payment_failed",
      stripeEventId: webhookEventId,
      sessionId: stripeSessionId,
      email: entry.email,
      amount: entry.amount,
      status: "failed",
      rawData: JSON.stringify({ stripeSessionId, errorMessage }),
      processed: true,
      error: errorMessage,
      createdAt: Date.now(),
    });

    console.log(`Payment failed for ${entry.email}: ${errorMessage}`);

    return { 
      success: true, 
      entryId: entry._id,
      email: entry.email 
    };
  },
});

/**
 * Get payment events for debugging (admin only)
 */
export const getPaymentEvents = query({
  args: { 
    limit: v.optional(v.number()),
    eventType: v.optional(v.string())
  },
  handler: async (ctx, { limit = 50, eventType }) => {
    let query = ctx.db.query("paymentEvents").order("desc");
    
    if (eventType) {
      query = query.filter((q) => q.eq(q.field("eventType"), eventType));
    }

    return await query.take(limit);
  },
});

/**
 * Get unprocessed payment events
 */
export const getUnprocessedEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("paymentEvents")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("desc")
      .collect();
  },
});

/**
 * Get entry by Stripe session ID
 */
export const getEntryBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("entries")
      .withIndex("by_stripe_session", (q) => q.eq("stripeSessionId", sessionId))
      .first();
  },
});

/**
 * Get current raffle configuration (public)
 */
export const getRaffleConfig = query({
  args: {},
  handler: async (ctx) => {
    const raffle = await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!raffle) {
      return null;
    }

    // Return public information only
    return {
      name: raffle.name,
      startDate: raffle.startDate,
      endDate: raffle.endDate,
      timerDisplayDate: raffle.timerDisplayDate, // For frontend timer display
      isActive: raffle.isActive,
      totalEntries: raffle.totalEntries,
      pricePerEntry: raffle.pricePerEntry,
      bundlePrice: raffle.bundlePrice,
      bundleSize: raffle.bundleSize,
      productName: raffle.productName,
      productDescription: raffle.productDescription,
      hasWinner: !!raffle.winner,
      maxWinners: raffle.maxWinners || 1,
    };
  },
});

/**
 * Get current raffle configuration (internal - includes all fields)
 */
export const getRaffleConfigInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("raffleConfig")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
  },
});
