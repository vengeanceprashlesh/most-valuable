import { NextResponse } from "next/server";

// POST /api/checkout
// Body: { quantity: number, email?: string, phone?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const quantity = Number(body?.quantity ?? 0);
    let email = typeof body?.email === "string" ? body.email : undefined;
    const phone = typeof body?.phone === "string" ? body.phone : undefined;
    
    // Product selection data
    const productId = typeof body?.productId === "string" ? body.productId : undefined;
    const variantId = typeof body?.variantId === "string" ? body.variantId : undefined;
    const selectedColor = typeof body?.selectedColor === "string" ? body.selectedColor : undefined;
    const selectedSize = typeof body?.selectedSize === "string" ? body.selectedSize : undefined;

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // Delegate to Convex action which also creates a pending entry
    const { ConvexHttpClient } = await import("convex/browser");
    const { api } = await import("../../../../convex/_generated/api");

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 });
    }

    const origin = (typeof req.headers.get === "function" && req.headers.get("origin")) || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const ipAddress =
      (typeof req.headers.get === "function" && (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip"))) ||
      undefined;

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    const isBundle = quantity === 4; // UI offers 1 or 4

    // TEMP workaround: Convex deployment still requires email; synthesize if absent
    if (!email) {
      const ts = Date.now();
      email = `guest+${ts}@example.com`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await convex.action((api as unknown as any).stripeActions.createCheckoutSession, {
      email: email?.toLowerCase(),
      phone,
      count: quantity,
      bundle: isBundle,
      successUrl: `${origin}/thank-you`,
      cancelUrl: `${origin}/shop`,
      ipAddress,
      // Product selection data
      productId,
      variantId,
      selectedColor,
      selectedSize,
    });

    return NextResponse.json({ url: result.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err ?? "Bad request");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

