import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Add a new lead to the database
 * Returns the existing lead ID if email already exists
 */
export const addLead = mutation({
  args: { 
    email: v.string(), 
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    ipAddress: v.optional(v.string())
  },
  handler: async (ctx, { email, phone, source, ipAddress }) => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check for existing lead
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    
    if (existing) {
      // Update existing lead with new information if provided
      if (phone && phone !== existing.phone) {
        // Validate phone before updating
        const intlPhoneRegex = /^\+[1-9]\d{6,14}$/; // E.164 format, 7 to 15 digits total
        if (!intlPhoneRegex.test(phone)) {
          throw new Error("Invalid phone number format. Please use international format like +14155552671.");
        }
        await ctx.db.patch(existing._id, { phone });
      }
      
      // Check if existing user already has a free entry
      const hasExistingFreeEntry = await ctx.db
        .query("entries")
        .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
        .filter((q) => q.eq(q.field("amount"), 0))
        .filter((q) => q.eq(q.field("paymentStatus"), "completed"))
        .first();
      
      return { 
        leadId: existing._id, 
        isNewLead: false,
        alreadyHasFreeEntry: !!hasExistingFreeEntry
      };
    }

    // Validate phone format if provided (International E.164)
    if (phone) {
      const intlPhoneRegex = /^\+[1-9]\d{6,14}$/; // E.164 format
      if (!intlPhoneRegex.test(phone)) {
        throw new Error("Invalid phone number format. Please use international format like +14155552671.");
      }
    }

    const now = Date.now();
    
    // Create the lead
    const leadId = await ctx.db.insert("leads", { 
      email: email.toLowerCase(), 
      phone, 
      source: source || "website",
      ipAddress,
      createdAt: now
    });

    // Create a free raffle entry ONLY for NEW leads (not existing ones)
    try {
      await ctx.runMutation(api.entries.addEntries, {
        email: email.toLowerCase(),
        phone,
        count: 1,
        amount: 0, // Free entry
        paymentStatus: "completed",
        ipAddress,
        bundle: false
      });
      console.log(`✅ Created free raffle entry for NEW lead: ${email.toLowerCase()}`);
    } catch (entryError) {
      // Log error but don't fail the lead creation
      console.error(`Failed to create free entry for ${email}:`, entryError);
      // Still return the lead ID since lead was created successfully
    }

    return { 
      leadId, 
      isNewLead: true,
      alreadyHasFreeEntry: false
    };
  },
});

/**
 * Get a lead by email address
 */
export const getLead = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
  },
});

/**
 * Get all leads with pagination
 */
export const getAllLeads = query({
  args: { 
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()) 
  },
  handler: async (ctx, { limit = 50, cursor }) => {
    let query = ctx.db.query("leads").order("desc");
    
    if (cursor) {
      query = query.filter((q) => q.lt(q.field("createdAt"), parseInt(cursor)));
    }
    
    const leads = await query.take(limit);
    return {
      leads,
      nextCursor: leads.length === limit ? leads[leads.length - 1].createdAt.toString() : null
    };
  },
});

/**
 * Get total leads count
 */
export const getTotalLeads = query({
  args: {},
  handler: async (ctx) => {
    const leads = await ctx.db.query("leads").collect();
    return leads.length;
  },
});

/**
 * Get leads by date range
 */
export const getLeadsByDateRange = query({
  args: { 
    startDate: v.number(), 
    endDate: v.number() 
  },
  handler: async (ctx, { startDate, endDate }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_created_at", (q) => 
        q.gte("createdAt", startDate).lte("createdAt", endDate)
      )
      .collect();
  },
});

/**
 * Check if an email already has a free raffle entry
 */
export const hasExistingFreeEntry = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const freeEntry = await ctx.db
      .query("entries")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .filter((q) => q.eq(q.field("amount"), 0))
      .filter((q) => q.eq(q.field("paymentStatus"), "completed"))
      .first();
    
    return !!freeEntry;
  },
});
