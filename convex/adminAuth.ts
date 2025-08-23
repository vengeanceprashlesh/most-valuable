import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// CRITICAL SECURITY SETTINGS
const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const ADMIN_PASSWORD_CORRECT = "mvr-admin-2025-secure-token"; // Current admin password

/**
 * Secure admin authentication with rate limiting and brute force protection
 */
export const adminLogin = mutation({
  args: {
    password: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, { password, ipAddress, userAgent }) => {
    const now = Date.now();
    const clientId = ipAddress || "unknown";

    // Check for existing lockout
    const lockoutRecord = await ctx.db
      .query("adminSecurity")
      .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
      .filter((q) => q.eq(q.field("type"), "lockout"))
      .order("desc")
      .first();

    if (lockoutRecord && (now - lockoutRecord.createdAt) < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (now - lockoutRecord.createdAt)) / 60000);
      throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    // Check recent failed attempts
    const recentAttempts = await ctx.db
      .query("adminSecurity")
      .withIndex("by_client_id", (q) => q.eq("clientId", clientId))
      .filter((q) => q.and(
        q.eq(q.field("type"), "failed_login"),
        q.gte(q.field("createdAt"), now - (15 * 60 * 1000)) // Last 15 minutes
      ))
      .collect();

    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      // Create lockout record
      await ctx.db.insert("adminSecurity", {
        type: "lockout",
        clientId,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        createdAt: now,
        data: JSON.stringify({ reason: "Too many failed attempts" }),
      });

      throw new Error("Too many failed attempts. Account locked for 30 minutes.");
    }

    // Verify password (in production, use bcrypt.compare)
    if (password !== ADMIN_PASSWORD_CORRECT) {
      // Log failed attempt
      await ctx.db.insert("adminSecurity", {
        type: "failed_login",
        clientId,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        createdAt: now,
        data: JSON.stringify({ password_length: password.length }),
      });

      throw new Error("Invalid credentials");
    }

    // Generate secure session token
    const sessionToken = `admin_session_${now}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;

    // Create secure session
    const sessionId = await ctx.db.insert("adminSessions", {
      sessionToken,
      clientId,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      createdAt: now,
      expiresAt: now + SESSION_DURATION,
      isActive: true,
    });

    // Log successful login
    await ctx.db.insert("adminSecurity", {
      type: "successful_login",
      clientId,
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
      createdAt: now,
      data: JSON.stringify({ sessionId }),
    });

    console.log(`🔐 ADMIN LOGIN: ${clientId} from ${ipAddress}`);

    return {
      success: true,
      sessionToken,
      expiresAt: now + SESSION_DURATION,
    };
  },
});

/**
 * Verify admin session token
 */
export const verifyAdminSession = query({
  args: {
    sessionToken: v.string(),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, { sessionToken, ipAddress }) => {
    const now = Date.now();

    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", sessionToken))
      .first();

    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    if (!session.isActive) {
      return { valid: false, reason: "Session deactivated" };
    }

    if (now > session.expiresAt) {
      return { valid: false, reason: "Session expired" };
    }

    // Optional: Check IP consistency (log warning but don't write in query)
    if (ipAddress && session.ipAddress !== "unknown" && session.ipAddress !== ipAddress) {
      console.warn(`⚠️ IP MISMATCH: Session ${sessionToken.substring(0, 20)}... changed IP from ${session.ipAddress} to ${ipAddress}`);
      return { valid: false, reason: "IP address mismatch detected" };
    }

    return {
      valid: true,
      sessionId: session._id,
      expiresAt: session.expiresAt,
      remainingTime: session.expiresAt - now,
    };
  },
});

/**
 * Logout admin session
 */
export const adminLogout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, { sessionToken }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isActive: false });
      
      await ctx.db.insert("adminSecurity", {
        type: "logout",
        clientId: session.clientId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: Date.now(),
        data: JSON.stringify({ sessionId: session._id }),
      });
    }

    return { success: true };
  },
});

/**
 * Get admin security logs (admin only)
 */
export const getAdminSecurityLogs = query({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { sessionToken, limit = 50 }) => {
    // Verify admin session first
    const sessionValid = await ctx.runQuery(api.adminAuth.verifyAdminSession, {
      sessionToken,
    });

    if (!sessionValid.valid) {
      throw new Error("Unauthorized access");
    }

    return await ctx.db
      .query("adminSecurity")
      .order("desc")
      .take(limit);
  },
});

/**
 * Reset all admin lockouts and failed attempts (for testing/recovery)
 */
export const resetAdminSecurity = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear all lockouts
    const lockouts = await ctx.db
      .query("adminSecurity")
      .filter((q) => q.eq(q.field("type"), "lockout"))
      .collect();

    for (const lockout of lockouts) {
      await ctx.db.delete(lockout._id);
    }

    // Clear all failed attempts from last 24 hours
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const failedAttempts = await ctx.db
      .query("adminSecurity")
      .filter((q) => q.and(
        q.eq(q.field("type"), "failed_login"),
        q.gte(q.field("createdAt"), oneDayAgo)
      ))
      .collect();

    for (const attempt of failedAttempts) {
      await ctx.db.delete(attempt._id);
    }

    console.log(`🔧 ADMIN SECURITY RESET: Cleared ${lockouts.length} lockouts and ${failedAttempts.length} failed attempts`);

    return {
      success: true,
      clearedLockouts: lockouts.length,
      clearedFailedAttempts: failedAttempts.length,
    };
  },
});

/**
 * Clean up expired sessions and old security logs
 */
export const cleanupAdminSecurity = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, { sessionToken }) => {
    // Verify admin session
    const sessionValid = await ctx.runQuery(api.adminAuth.verifyAdminSession, {
      sessionToken,
    });

    if (!sessionValid.valid) {
      throw new Error("Unauthorized access");
    }

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Clean up expired sessions
    const expiredSessions = await ctx.db
      .query("adminSessions")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id);
    }

    // Clean up old security logs (keep last 30 days)
    const oldLogs = await ctx.db
      .query("adminSecurity")
      .filter((q) => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .collect();

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return {
      success: true,
      cleanedSessions: expiredSessions.length,
      cleanedLogs: oldLogs.length,
    };
  },
});
