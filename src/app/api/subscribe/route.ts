import { NextResponse } from "next/server";

type Body = { email?: string; phone?: string };

export async function POST(request: Request) {
  try {
    const { email, phone } = (await request.json()) as Body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (phone && typeof phone !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid phone" }, { status: 400 });
    }
    // Optional phone normalization/validation (E.164) - let Convex do final validation too
    if (phone) {
      const e164 = /^\+[1-9]\d{6,14}$/;
      if (!e164.test(phone)) {
        return NextResponse.json(
          { ok: false, error: "Invalid phone number. Use international format like +14155552671." },
          { status: 400 }
        );
      }
    }

    // Integrate with Convex lead collection
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../convex/_generated/api");

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ ok: false, error: "Convex URL not configured" }, { status: 500 });
    }

    const convex = new ConvexHttpClient(convexUrl);

    const ipAddress =
      (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "") as string;

    await convex.mutation(api.leads.addLead, {
      email: email.toLowerCase(),
      phone: phone || undefined,
      source: "landing",
      ipAddress,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bad request";
    // Send through specific errors (e.g., phone validation) while keeping 400 status
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

