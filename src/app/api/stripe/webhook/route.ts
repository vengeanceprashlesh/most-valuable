import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs"; // Ensure Node runtime for Stripe SDK
export const dynamic = "force-dynamic"; // Never cache this route

export async function POST(req: Request) {
  let StripeCtor: typeof import("stripe").default;
  try {
    StripeCtor = (await import("stripe")).default;
  } catch {
    // Stripe not installed; acknowledge to prevent retries during local dev
    return new NextResponse("Stripe SDK missing", { status: 200 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("No signature", { status: 400 });

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new NextResponse("Missing webhook secret", { status: 500 });

  const stripe = new StripeCtor(process.env.STRIPE_SECRET_KEY || "");

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const entriesCount = Number(session?.metadata?.entriesCount ?? 0);
    const email = (session?.metadata?.email as string | undefined) ?? session?.customer_details?.email ?? "";
    const phone = (session?.metadata?.phone as string | undefined) ?? session?.customer_details?.phone ?? "";
    const amount = Number(session?.amount_total ?? 0);

    // TODO: Integrate with Convex mutation to persist entries
    console.log("[stripe] checkout.session.completed", { email, phone, entriesCount, amount });
  }

  return NextResponse.json({ received: true });
}
