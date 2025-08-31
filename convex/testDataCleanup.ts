import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Clean up specific test entries from all database tables
 * ONLY removes the specified test emails while preserving all real user data
 */
export const cleanupTestData = mutation({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, { adminToken }) => {
    // Verify admin token
    if (adminToken !== "mvr-admin-2025-secure-token") {
      throw new Error("Unauthorized: Invalid admin token");
    }

    // List of ONLY the test emails to remove
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
      errorLogsDeleted: 0,
    };

    console.log(`🧹 Starting cleanup of test data for emails: ${testEmailsToRemove.join(", ")}`);

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

    // 7. Remove error logs that might contain test email references
    const errorLogs = await ctx.db.query("errorLogs").collect();
    for (const errorLog of errorLogs) {
      try {
        const context = typeof errorLog.context === 'string' ? JSON.parse(errorLog.context) : errorLog.context;
        if (context && context.email && testEmailsToRemove.includes(context.email)) {
          await ctx.db.delete(errorLog._id);
          deletionSummary.errorLogsDeleted++;
          console.log(`✅ Deleted error log for: ${context.email}`);
        }
      } catch (error) {
        // Skip if context is not parseable
        continue;
      }
    }

    console.log(`🎉 Cleanup completed! Summary:`, deletionSummary);

    return {
      success: true,
      message: "Test data cleanup completed successfully",
      testEmailsRemoved: testEmailsToRemove,
      deletionSummary
    };
  },
});
