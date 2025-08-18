import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Webhook signature verification failed:`, message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type} (${event.id})`);

    // Extract relevant data based on event type
    let sessionId: string | undefined;
    let paymentIntentId: string | undefined;

    switch (event.type) {
      case 'checkout.session.completed':
        const completedSession = event.data.object as Stripe.Checkout.Session;
        sessionId = completedSession.id;
        paymentIntentId = completedSession.payment_intent as string;
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        sessionId = expiredSession.id;
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        paymentIntentId = failedIntent.id;
        // Try to find session ID from metadata or latest invoice
        sessionId = failedIntent.metadata?.session_id;
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }

    // Process the webhook through Convex
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await convex.action((api as any).stripeActions.handleStripeWebhook, {
        eventType: event.type,
        eventId: event.id,
        sessionId,
        paymentIntentId,
        rawData: JSON.stringify(event),
      });

      console.log(`Webhook processed successfully:`, result);
      return NextResponse.json({ 
        received: true, 
        processed: true,
        result 
      });

    } catch (convexError: unknown) {
      const message = convexError instanceof Error ? convexError.message : String(convexError);
      console.error(`Convex processing error:`, convexError);
      
      // Return 200 to acknowledge receipt but log the processing error
      // This prevents Stripe from retrying if it's a data/logic error
      return NextResponse.json({
        received: true,
        processed: false,
        error: message,
      });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Webhook handler error:`, error);
    return NextResponse.json(
      { error: `Webhook handler error: ${message}` },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook endpoint verification)
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
