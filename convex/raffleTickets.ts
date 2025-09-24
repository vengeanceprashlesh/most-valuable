import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Assign ticket numbers to a completed raffle entry
 * This ensures fair distribution where each entry gets sequential ticket numbers
 */
export const assignTicketsToEntry = mutation({
  args: {
    entryId: v.id("entries"),
  },
  handler: async (ctx, { entryId }) => {
    // Get the entry
    const entry = await ctx.db.get(entryId);
    if (!entry) {
      throw new Error("Entry not found");
    }

    if (entry.paymentStatus !== "completed") {
      throw new Error("Cannot assign tickets to non-completed entry");
    }

    // Check if tickets already assigned to prevent duplicates
    const existingTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_entry", (q) => q.eq("entryId", entryId))
      .collect();

    if (existingTickets.length > 0) {
      console.log(`Tickets already assigned to entry ${entryId}`);
      return { success: true, ticketsAssigned: existingTickets.length };
    }

    // Get the current highest ticket number
    const allTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number")
      .order("desc")
      .take(1);

    let nextTicketNumber = 1;
    if (allTickets.length > 0) {
      nextTicketNumber = allTickets[0].ticketNumber + 1;
    }

    // Assign sequential ticket numbers for this entry
    const ticketIds = [];
    for (let i = 0; i < entry.count; i++) {
      const ticketId = await ctx.db.insert("raffleTickets", {
        entryId,
        email: entry.email,
        ticketNumber: nextTicketNumber + i,
        createdAt: Date.now(),
      });
      ticketIds.push(ticketId);
    }

    console.log(`✅ Assigned ${entry.count} tickets (${nextTicketNumber} to ${nextTicketNumber + entry.count - 1}) to ${entry.email}`);

    return {
      success: true,
      ticketsAssigned: entry.count,
      startTicketNumber: nextTicketNumber,
      endTicketNumber: nextTicketNumber + entry.count - 1,
      ticketIds,
    };
  },
});

/**
 * Get all tickets for a specific email
 */
export const getTicketsByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("raffleTickets")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .order("asc")
      .collect();
  },
});

/**
 * Get ticket by specific ticket number
 */
export const getTicketByNumber = query({
  args: { ticketNumber: v.number() },
  handler: async (ctx, { ticketNumber }) => {
    return await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", ticketNumber))
      .first();
  },
});

/**
 * Get total tickets in the current raffle pool
 */
export const getTotalTicketsInPool = query({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db.query("raffleTickets").collect();
    return allTickets.length;
  },
});

/**
 * Get raffle statistics showing fair distribution
 */
export const getRaffleTicketStats = query({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db.query("raffleTickets").collect();
    
    // Group by email to show distribution
    const ticketsByEmail = new Map<string, number>();
    for (const ticket of allTickets) {
      const count = ticketsByEmail.get(ticket.email) || 0;
      ticketsByEmail.set(ticket.email, count + 1);
    }

    // Convert to array and sort by ticket count
    const distribution = Array.from(ticketsByEmail.entries())
      .map(([email, count]) => ({ email, ticketCount: count }))
      .sort((a, b) => b.ticketCount - a.ticketCount);

    return {
      totalTickets: allTickets.length,
      uniqueParticipants: ticketsByEmail.size,
      distribution,
      averageTicketsPerParticipant: allTickets.length / ticketsByEmail.size || 0,
    };
  },
});

/**
 * Validate ticket assignment integrity
 */
export const validateTicketIntegrity = query({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number")
      .order("asc")
      .collect();

    const issues = [];
    
    // Check for sequential numbering
    for (let i = 0; i < allTickets.length; i++) {
      const expectedNumber = i + 1;
      if (allTickets[i].ticketNumber !== expectedNumber) {
        issues.push(`Gap in ticket numbering: expected ${expectedNumber}, found ${allTickets[i].ticketNumber}`);
      }
    }

    // Check for duplicates
    const ticketNumbers = allTickets.map(t => t.ticketNumber);
    const uniqueNumbers = new Set(ticketNumbers);
    if (ticketNumbers.length !== uniqueNumbers.size) {
      issues.push("Duplicate ticket numbers found");
    }

    // Verify against entries - only count raffle entries, not direct purchases
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .collect();

    // Filter out direct purchases that shouldn't have raffle tickets
    const raffleEntries = completedEntries.filter(entry => {
      const isDirectPurchase = entry.productId === "mv-hoodie" || 
                               entry.productId === "mv-tee" ||
                               entry.productId === "p6" || 
                               entry.productId === "p7" ||
                               entry.productId === "p1b" || 
                               entry.productId === "p1w";
      return !isDirectPurchase;
    });

    const expectedTotalTickets = raffleEntries.reduce((sum, entry) => sum + entry.count, 0);
    if (allTickets.length !== expectedTotalTickets) {
      issues.push(`Ticket count mismatch: expected ${expectedTotalTickets}, found ${allTickets.length}`);
    }

    return {
      isValid: issues.length === 0,
      totalTickets: allTickets.length,
      expectedTickets: expectedTotalTickets,
      issues,
      totalEntries: completedEntries.length,
      raffleEntries: raffleEntries.length,
      directPurchases: completedEntries.length - raffleEntries.length,
    };
  },
});

/**
 * Completely rebuild raffle tickets from scratch
 * This fixes any gaps or inconsistencies in ticket numbering
 */
export const rebuildAllRaffleTickets = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, { adminToken }) => {
    // Verify admin token
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    console.log("🚨 REBUILDING ALL RAFFLE TICKETS");

    // Step 1: Delete all existing raffle tickets
    const existingTickets = await ctx.db.query("raffleTickets").collect();
    for (const ticket of existingTickets) {
      await ctx.db.delete(ticket._id);
    }
    console.log(`🗑️ Deleted ${existingTickets.length} existing tickets`);

    // Step 2: Get all completed entries that should have raffle tickets
    const completedEntries = await ctx.db
      .query("entries")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", "completed"))
      .order("asc") // Process in chronological order for fairness
      .collect();

    // Filter out direct purchases
    const raffleEntries = completedEntries.filter(entry => {
      const isDirectPurchase = entry.productId === "mv-hoodie" || 
                               entry.productId === "mv-tee" ||
                               entry.productId === "p6" || 
                               entry.productId === "p7" ||
                               entry.productId === "p1b" || 
                               entry.productId === "p1w";
      return !isDirectPurchase;
    });

    console.log(`📊 Found ${raffleEntries.length} raffle entries out of ${completedEntries.length} total entries`);

    // Step 3: Reassign tickets sequentially
    let currentTicketNumber = 1;
    const reassignedTickets = [];

    for (const entry of raffleEntries) {
      // Assign sequential ticket numbers for this entry
      for (let i = 0; i < entry.count; i++) {
        const ticketId = await ctx.db.insert("raffleTickets", {
          entryId: entry._id,
          email: entry.email,
          ticketNumber: currentTicketNumber + i,
          createdAt: Date.now(),
        });
        reassignedTickets.push({
          ticketId,
          ticketNumber: currentTicketNumber + i,
          email: entry.email,
          entryId: entry._id,
        });
      }
      
      console.log(`✅ Assigned ${entry.count} tickets (${currentTicketNumber} to ${currentTicketNumber + entry.count - 1}) to ${entry.email}`);
      currentTicketNumber += entry.count;
    }

    console.log(`🎯 REBUILD COMPLETE: ${reassignedTickets.length} tickets reassigned`);

    return {
      success: true,
      deletedTickets: existingTickets.length,
      reassignedTickets: reassignedTickets.length,
      totalRaffleEntries: raffleEntries.length,
      totalDirectPurchases: completedEntries.length - raffleEntries.length,
      finalTicketRange: reassignedTickets.length > 0 ? 
        `${reassignedTickets[0].ticketNumber} to ${reassignedTickets[reassignedTickets.length - 1].ticketNumber}` : "None",
    };
  },
});
