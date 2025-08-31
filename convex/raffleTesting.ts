import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Simulate raffle entries for testing fairness
 */
export const createTestRaffleEntries = mutation({
  args: {
    adminToken: v.string(),
    scenarios: v.array(
      v.object({
        email: v.string(),
        entryCount: v.number(),
      })
    ),
  },
  handler: async (ctx, { adminToken, scenarios }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }

    const createdEntries = [];
    const now = Date.now();

    for (const scenario of scenarios) {
      // Create completed entry
      const entryId = await ctx.db.insert("entries", {
        email: scenario.email,
        count: scenario.entryCount,
        amount: scenario.entryCount * 2500, // $25 per entry
        paymentStatus: "completed",
        bundle: scenario.entryCount === 5,
        createdAt: now,
        stripeSessionId: `test_session_${Math.random()}`,
        stripePaymentIntent: `test_pi_${Math.random()}`,
      });

      // Assign tickets
      await ctx.runMutation(api.raffleTickets.assignTicketsToEntry, {
        entryId,
      });

      createdEntries.push({ entryId, email: scenario.email, count: scenario.entryCount });
    }

    console.log(`Created ${createdEntries.length} test entries for fairness testing`);
    return createdEntries;
  },
});

/**
 * Run fairness simulation - select winners multiple times to test distribution
 */
export const runFairnessSimulation = mutation({
  args: {
    adminToken: v.string(),
    simulations: v.number(), // How many times to simulate winner selection
  },
  handler: async (ctx, { adminToken, simulations }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }

    // Get all tickets for simulation
    const allTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number")
      .order("asc")
      .collect();

    if (allTickets.length === 0) {
      throw new Error("No tickets found for simulation");
    }

    // Group tickets by email for analysis
    const ticketsByEmail = new Map<string, number[]>();
    for (const ticket of allTickets) {
      if (!ticketsByEmail.has(ticket.email)) {
        ticketsByEmail.set(ticket.email, []);
      }
      ticketsByEmail.get(ticket.email)!.push(ticket.ticketNumber);
    }

    // Run simulations
    const winCounts = new Map<string, number>();
    const simulationResults = [];

    for (let i = 0; i < simulations; i++) {
      // Simulate random winner selection
      const randomTicketNumber = Math.floor(Math.random() * allTickets.length) + 1;
      const winningTicket = allTickets.find(t => t.ticketNumber === randomTicketNumber);
      
      if (winningTicket) {
        const currentCount = winCounts.get(winningTicket.email) || 0;
        winCounts.set(winningTicket.email, currentCount + 1);
        
        simulationResults.push({
          simulation: i + 1,
          winningTicketNumber: randomTicketNumber,
          winnerEmail: winningTicket.email,
        });
      }
    }

    // Calculate fairness statistics
    const fairnessAnalysis = [];
    for (const [email, ticketNumbers] of ticketsByEmail.entries()) {
      const ticketCount = ticketNumbers.length;
      const winCount = winCounts.get(email) || 0;
      const expectedWinRate = (ticketCount / allTickets.length) * 100;
      const actualWinRate = (winCount / simulations) * 100;
      const variance = Math.abs(actualWinRate - expectedWinRate);

      fairnessAnalysis.push({
        email,
        ticketCount,
        ticketNumbers: ticketNumbers.sort((a, b) => a - b),
        winCount,
        expectedWinRate: Number(expectedWinRate.toFixed(2)),
        actualWinRate: Number(actualWinRate.toFixed(2)),
        variance: Number(variance.toFixed(2)),
        isFair: variance < 5, // Allow 5% variance as acceptable
      });
    }

    // Sort by ticket count to see the distribution clearly
    fairnessAnalysis.sort((a, b) => b.ticketCount - a.ticketCount);

    // Overall fairness score
    const avgVariance = fairnessAnalysis.reduce((sum, f) => sum + f.variance, 0) / fairnessAnalysis.length;
    const overallFairness = avgVariance < 3 ? "EXCELLENT" : avgVariance < 5 ? "GOOD" : avgVariance < 10 ? "ACCEPTABLE" : "POOR";

    console.log(`🧪 Fairness Simulation Complete: ${simulations} simulations, ${fairnessAnalysis.length} participants, Average variance: ${avgVariance.toFixed(2)}%`);

    return {
      simulationCount: simulations,
      totalTickets: allTickets.length,
      totalParticipants: fairnessAnalysis.length,
      averageVariance: Number(avgVariance.toFixed(2)),
      overallFairness,
      participantAnalysis: fairnessAnalysis,
      simulationResults: simulationResults.slice(0, 10), // Return first 10 for inspection
    };
  },
});

/**
 * Analyze current raffle ticket distribution
 */
export const analyzeRaffleDistribution = query({
  args: {},
  handler: async (ctx) => {
    const allTickets = await ctx.db
      .query("raffleTickets")
      .withIndex("by_ticket_number")
      .order("asc")
      .collect();

    if (allTickets.length === 0) {
      return {
        totalTickets: 0,
        participants: [],
        distributionStats: null,
      };
    }

    // Group by email and analyze distribution
    const participantMap = new Map<string, {
      email: string;
      ticketCount: number;
      ticketNumbers: number[];
      winningProbability: number;
    }>();

    for (const ticket of allTickets) {
      if (!participantMap.has(ticket.email)) {
        participantMap.set(ticket.email, {
          email: ticket.email,
          ticketCount: 0,
          ticketNumbers: [],
          winningProbability: 0,
        });
      }
      
      const participant = participantMap.get(ticket.email)!;
      participant.ticketCount++;
      participant.ticketNumbers.push(ticket.ticketNumber);
      participant.winningProbability = (participant.ticketCount / allTickets.length) * 100;
    }

    // Convert to array and sort by ticket count
    const participants = Array.from(participantMap.values())
      .map(p => ({
        ...p,
        ticketNumbers: p.ticketNumbers.sort((a, b) => a - b),
        winningProbability: Number(p.winningProbability.toFixed(4)),
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount);

    // Calculate distribution statistics
    const ticketCounts = participants.map(p => p.ticketCount);
    const minTickets = Math.min(...ticketCounts);
    const maxTickets = Math.max(...ticketCounts);
    const avgTickets = ticketCounts.reduce((sum, count) => sum + count, 0) / ticketCounts.length;
    const medianTickets = ticketCounts.sort((a, b) => a - b)[Math.floor(ticketCounts.length / 2)];

    // Check for sequential integrity
    const expectedNumbers = Array.from({ length: allTickets.length }, (_, i) => i + 1);
    const actualNumbers = allTickets.map(t => t.ticketNumber).sort((a, b) => a - b);
    const hasIntegrity = JSON.stringify(expectedNumbers) === JSON.stringify(actualNumbers);

    return {
      totalTickets: allTickets.length,
      totalParticipants: participants.length,
      participants,
      distributionStats: {
        minTicketsPerParticipant: minTickets,
        maxTicketsPerParticipant: maxTickets,
        averageTicketsPerParticipant: Number(avgTickets.toFixed(2)),
        medianTicketsPerParticipant: medianTickets,
        ticketIntegrity: hasIntegrity,
      },
      equityScore: maxTickets === minTickets ? "PERFECTLY_EQUAL" : 
                   maxTickets <= minTickets * 2 ? "WELL_BALANCED" :
                   maxTickets <= minTickets * 5 ? "MODERATELY_FAIR" : "HIGH_VARIANCE",
    };
  },
});

/**
 * Clear all test data (use with caution!)
 */
export const clearTestData = mutation({
  args: {
    adminToken: v.string(),
    confirmPhrase: v.string(),
  },
  handler: async (ctx, { adminToken, confirmPhrase }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized");
    }

    if (confirmPhrase !== "CLEAR_ALL_TEST_DATA") {
      throw new Error("Invalid confirmation phrase");
    }

    // Clear tickets
    const allTickets = await ctx.db.query("raffleTickets").collect();
    for (const ticket of allTickets) {
      await ctx.db.delete(ticket._id);
    }

    // Clear test entries (keep real ones with stripe data)
    const testEntries = await ctx.db
      .query("entries")
      .filter((q) => q.and(
        q.neq(q.field("stripeSessionId"), undefined),
        q.gte(q.field("stripeSessionId"), "test_session_")
      ))
      .collect();
    
    for (const entry of testEntries) {
      await ctx.db.delete(entry._id);
    }

    // Clear any test winners
    const testWinners = await ctx.db.query("raffleWinners").collect();
    for (const winner of testWinners) {
      await ctx.db.delete(winner._id);
    }

    console.log(`🧹 Cleared ${allTickets.length} tickets, ${testEntries.length} test entries, and ${testWinners.length} test winners`);

    return {
      success: true,
      cleared: {
        tickets: allTickets.length,
        entries: testEntries.length,
        winners: testWinners.length,
      },
    };
  },
});

/**
 * Clean up specific test entries only (preserves real user data)
 */
export const cleanupSpecificTestData = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, { adminToken }) => {
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // List of ONLY the specific test emails to remove
    const testEmailsToRemove = [
      "final-test-1756616322176@test.com",
      "test-duplicate-1756615984623@test.com",
      "adarshjagannath777@gmail.com",
      "test@example.com",
      "adarshjagannath.a_2028@woxsen.edu.in"
    ];

    let deletionSummary = {
      entriesDeleted: 0,
      raffleTicketsDeleted: 0,
      leadsDeleted: 0,
      paymentEventsDeleted: 0,
      adminNotificationsDeleted: 0,
      emailLogsDeleted: 0,
    };

    console.log(`🧹 Starting cleanup of specific test data for emails: ${testEmailsToRemove.join(", ")}`);

    // 1. Remove entries
    const entries = await ctx.db.query("entries").collect();
    for (const entry of entries) {
      if (testEmailsToRemove.includes(entry.email)) {
        await ctx.db.delete(entry._id);
        deletionSummary.entriesDeleted++;
        console.log(`✅ Deleted entry: ${entry.email} - ${entry._id}`);
      }
    }

    // 2. Remove raffle tickets
    const raffleTickets = await ctx.db.query("raffleTickets").collect();
    for (const ticket of raffleTickets) {
      if (testEmailsToRemove.includes(ticket.email)) {
        await ctx.db.delete(ticket._id);
        deletionSummary.raffleTicketsDeleted++;
        console.log(`✅ Deleted raffle ticket: ${ticket.email} - ticket #${ticket.ticketNumber}`);
      }
    }

    // 3. Remove leads
    const leads = await ctx.db.query("leads").collect();
    for (const lead of leads) {
      if (testEmailsToRemove.includes(lead.email)) {
        await ctx.db.delete(lead._id);
        deletionSummary.leadsDeleted++;
        console.log(`✅ Deleted lead: ${lead.email} - ${lead._id}`);
      }
    }

    // 4. Remove payment events
    const paymentEvents = await ctx.db.query("paymentEvents").collect();
    for (const event of paymentEvents) {
      if (event.email && testEmailsToRemove.includes(event.email)) {
        await ctx.db.delete(event._id);
        deletionSummary.paymentEventsDeleted++;
        console.log(`✅ Deleted payment event: ${event.email} - ${event.eventType}`);
      }
    }

    // 5. Remove admin notifications
    const adminNotifications = await ctx.db.query("adminNotifications").collect();
    for (const notification of adminNotifications) {
      try {
        const data = typeof notification.data === 'string' ? JSON.parse(notification.data) : notification.data;
        if (data && data.email && testEmailsToRemove.includes(data.email)) {
          await ctx.db.delete(notification._id);
          deletionSummary.adminNotificationsDeleted++;
          console.log(`✅ Deleted admin notification for: ${data.email}`);
        }
      } catch (error) {
        // Skip if data is not parseable
        continue;
      }
    }

    // 6. Remove email logs
    const emailLogs = await ctx.db.query("emailLogs").collect();
    for (const emailLog of emailLogs) {
      if (testEmailsToRemove.includes(emailLog.to)) {
        await ctx.db.delete(emailLog._id);
        deletionSummary.emailLogsDeleted++;
        console.log(`✅ Deleted email log: ${emailLog.to} - ${emailLog.subject}`);
      }
    }

    console.log(`🎉 Cleanup completed! Summary:`, deletionSummary);

    return {
      success: true,
      message: "Specific test data cleanup completed successfully",
      testEmailsRemoved: testEmailsToRemove,
      deletionSummary
    };
  },
});
