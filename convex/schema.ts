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
    bundle: v.optional(v.boolean()), // Whether it was a bundle purchase (4 for $100)
    // Product selection details
    productId: v.optional(v.string()), // Product ID (e.g., "raffle")
    productName: v.optional(v.string()), // Product name for easy reference
    variantId: v.optional(v.string()), // Selected variant (color) ID
    variantColor: v.optional(v.string()), // Selected color name (e.g., "Black", "White")
    size: v.optional(v.string()), // Selected size (e.g., "M", "L")
    productCategory: v.optional(v.string()), // Category (e.g., "tee")
    // Address collection for delivery
    shippingAddress: v.optional(v.object({
      firstName: v.string(),
      lastName: v.string(),
      company: v.optional(v.string()),
      address1: v.string(),
      address2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.optional(v.string()),
    })),
  }).index("by_email", ["email"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_created_at", ["createdAt"])
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_product", ["productId"])
    .index("by_variant", ["variantId"])
    .index("by_size", ["size"]),

  // Raffle configuration
  raffleConfig: defineTable({
    name: v.string(),
    startDate: v.number(), // When raffle starts accepting entries
    endDate: v.number(), // When raffle ends
    timerDisplayDate: v.optional(v.number()), // When timer should start counting down (for display purposes)
    paymentStartDate: v.optional(v.number()), // When payments should be accepted (defaults to startDate)
    isActive: v.boolean(),
    totalEntries: v.number(),
    winner: v.optional(v.string()), // Email of winner
    winnerSelectedAt: v.optional(v.number()),
    pricePerEntry: v.number(), // In cents
    bundlePrice: v.number(), // In cents
    bundleSize: v.number(),
    productName: v.string(),
    productDescription: v.optional(v.string()),
    maxWinners: v.optional(v.number()), // Number of winners to select (default: 1)
  }).index("by_active", ["isActive"]),

  // Raffle winner history with full audit trail
  raffleWinners: defineTable({
    raffleConfigId: v.id("raffleConfig"),
    winnerEmail: v.string(),
    winnerEntryId: v.id("entries"), // Reference to the winning entry
    selectedAt: v.number(),
    totalEntriesInPool: v.number(), // Total entries when winner was selected
    winningTicketNumber: v.number(), // The randomly selected ticket number
    randomSeed: v.string(), // For audit verification
    selectionMethod: v.string(), // Algorithm used
    verificationHash: v.string(), // Hash for verification
    isActive: v.boolean(),
    contactedAt: v.optional(v.number()),
    prizeDeliveredAt: v.optional(v.number()),
    deliveryAddress: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_raffle", ["raffleConfigId"])
    .index("by_active", ["isActive"])
    .index("by_winner_email", ["winnerEmail"])
    .index("by_selected_at", ["selectedAt"]),

  // Individual ticket tracking for complete audit trail
  raffleTickets: defineTable({
    entryId: v.id("entries"),
    email: v.string(),
    ticketNumber: v.number(), // Sequential ticket number in the pool
    createdAt: v.number(),
  }).index("by_entry", ["entryId"])
    .index("by_email", ["email"])
    .index("by_ticket_number", ["ticketNumber"])
    .index("by_created_at", ["createdAt"]),

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

  // Admin notifications for order management
  adminNotifications: defineTable({
    type: v.string(), // "new_order", "payment_failed", "refund_requested", etc.
    title: v.string(),
    message: v.string(),
    data: v.any(), // Additional structured data
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_read_status", ["isRead"])
    .index("by_type", ["type"])
    .index("by_created_at", ["createdAt"]),

  // Email notification logs
  emailLogs: defineTable({
    to: v.string(),
    subject: v.string(),
    message: v.string(),
    data: v.string(), // JSON stringified
    status: v.string(), // "pending", "sent", "failed"
    sentAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_status", ["status"])
    .index("by_sent_at", ["sentAt"]),

  // Error logging for debugging and monitoring
  errorLogs: defineTable({
    type: v.string(),
    message: v.string(),
    context: v.string(), // JSON stringified
    severity: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    stackTrace: v.optional(v.string()),
    resolved: v.boolean(),
    resolution: v.optional(v.string()),
    resolvedBy: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_type", ["type"])
    .index("by_severity", ["severity"])
    .index("by_resolved", ["resolved"])
    .index("by_created_at", ["createdAt"]),

  // Admin security logs - tracks all login attempts, failures, and suspicious activity
  adminSecurity: defineTable({
    type: v.string(), // "failed_login", "successful_login", "lockout", "ip_mismatch", "logout"
    clientId: v.string(), // IP address or unique identifier
    ipAddress: v.string(),
    userAgent: v.string(),
    createdAt: v.number(),
    data: v.string(), // JSON stringified additional data
  }).index("by_type", ["type"])
    .index("by_client_id", ["clientId"])
    .index("by_ip", ["ipAddress"])
    .index("by_created_at", ["createdAt"]),

  // Admin sessions - secure session management
  adminSessions: defineTable({
    sessionToken: v.string(),
    clientId: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    isActive: v.boolean(),
  }).index("by_session_token", ["sessionToken"])
    .index("by_client_id", ["clientId"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_active", ["isActive"]),
});
