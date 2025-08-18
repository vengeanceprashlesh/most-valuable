import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Lead collection table
  leads: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    createdAt: v.number(),
    source: v.optional(v.string()), // Track where the lead came from
    ipAddress: v.optional(v.string()), // For fraud detection
  }).index("by_email", ["email"])
    .index("by_created_at", ["createdAt"]),

  // Raffle entries table
  entries: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    count: v.number(), // Number of entries purchased
    amount: v.number(), // Amount paid in cents
    stripePaymentIntent: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    paymentStatus: v.string(), // 'pending', 'completed', 'failed', 'refunded'
    createdAt: v.number(),
    ipAddress: v.optional(v.string()),
    bundle: v.optional(v.boolean()), // Whether it was a bundle purchase (5 for $100)
  }).index("by_email", ["email"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_created_at", ["createdAt"])
    .index("by_stripe_session", ["stripeSessionId"]),

  // Raffle configuration
  raffleConfig: defineTable({
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    totalEntries: v.number(),
    winner: v.optional(v.string()), // Email of winner
    winnerSelectedAt: v.optional(v.number()),
    pricePerEntry: v.number(), // In cents
    bundlePrice: v.number(), // In cents
    bundleSize: v.number(),
    productName: v.string(),
    productDescription: v.optional(v.string()),
  }).index("by_active", ["isActive"]),

  // Winner selection table - stores the randomly selected winner
  winners: defineTable({
    winnerEmail: v.string(),
    selectedAt: v.number(),
    raffleEndDate: v.number(), // When the raffle ended
    totalLeadsCount: v.number(), // How many leads were eligible
    selectionMethod: v.string(), // 'crypto.randomInt' for transparency
    isActive: v.boolean(), // Only one active winner at a time
  }).index("by_active", ["isActive"])
    .index("by_selected_at", ["selectedAt"]),

  // Payment webhooks log for debugging
  paymentEvents: defineTable({
    eventType: v.string(),
    stripeEventId: v.string(),
    paymentIntent: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    email: v.optional(v.string()),
    amount: v.optional(v.number()),
    status: v.string(),
    rawData: v.string(), // JSON stringified webhook data
    processed: v.boolean(),
    createdAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_stripe_event", ["stripeEventId"])
    .index("by_payment_intent", ["paymentIntent"])
    .index("by_session", ["sessionId"])
    .index("by_processed", ["processed"]),
});
