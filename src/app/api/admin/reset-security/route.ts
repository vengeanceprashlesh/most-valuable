import { NextResponse } from "next/server";

// POST /api/admin/reset-security
// Reset admin security lockouts for testing/recovery
export async function POST() {
  try {
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../../convex/_generated/api");

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    // Reset admin security (clear lockouts and failed attempts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await convex.mutation((api as unknown as any).adminAuth.resetAdminSecurity, {});

    return NextResponse.json({
      success: true,
      message: `Admin security reset completed. Cleared ${result.clearedLockouts} lockouts and ${result.clearedFailedAttempts} failed attempts.`,
      clearedLockouts: result.clearedLockouts,
      clearedFailedAttempts: result.clearedFailedAttempts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err ?? "Failed to reset admin security");
    return NextResponse.json({ 
      error: message,
      success: false 
    }, { status: 500 });
  }
}

// GET /api/admin/reset-security
// Get current security status
export async function GET() {
  try {
    return NextResponse.json({
      message: "Admin security reset endpoint is available",
      usage: "POST to this endpoint to clear all admin lockouts and failed login attempts",
      note: "This is for recovery purposes when admin access is locked"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err ?? "Failed to get security status");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
