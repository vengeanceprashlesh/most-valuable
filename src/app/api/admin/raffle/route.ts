import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Middleware to verify admin token
function verifyAdminToken(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return false;
  }
  return token;
}

export async function POST(req: NextRequest) {
  try {
    const adminToken = verifyAdminToken(req);
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'setup_raffle':
        const { name, startDate, endDate, pricePerEntry, bundlePrice, bundleSize, productName, productDescription } = params;
        
        if (!name || !startDate || !endDate || !pricePerEntry || !bundlePrice || !bundleSize || !productName) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }

        // entriesNode types may be narrowed in generated API; cast to access our server actions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raffleId = await convex.action((api as unknown as any).entriesNode.setupRaffle, {
          adminToken,
          name,
          startDate: new Date(startDate).getTime(),
          endDate: new Date(endDate).getTime(),
          pricePerEntry: Math.round(pricePerEntry * 100), // Convert to cents
          bundlePrice: Math.round(bundlePrice * 100), // Convert to cents
          bundleSize,
          productName,
          productDescription,
        });

        return NextResponse.json({
          success: true,
          raffleId,
          message: 'Raffle configured successfully'
        });

      case 'select_winner':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const winnerResult = await convex.action((api as unknown as any).entriesNode.selectWinner, {
          adminToken,
        });

        return NextResponse.json({
          success: true,
          ...winnerResult,
          message: winnerResult.alreadySelected 
            ? 'Winner was already selected' 
            : 'Winner selected successfully'
        });

      case 'end_raffle':
        const endResult = await convex.action(api.entriesNode.endRaffle, {
          adminToken,
        });

        return NextResponse.json({
          ...endResult,
          message: 'Raffle ended successfully'
        });

      case 'extend_raffle':
        const { newEndDate } = params;
        if (!newEndDate) {
          return NextResponse.json(
            { error: 'New end date is required' },
            { status: 400 }
          );
        }

        const extendResult = await convex.action(api.entriesNode.extendRaffle, {
          adminToken,
          newEndDate: new Date(newEndDate).getTime(),
        });

        return NextResponse.json({
          ...extendResult,
          message: 'Raffle extended successfully'
        });

      case 'notify_winner':
        const { winnerEmail } = params;
        if (!winnerEmail) {
          return NextResponse.json(
            { error: 'Winner email is required' },
            { status: 400 }
          );
        }

        const notifyResult = await convex.action(api.entriesNode.notifyWinner, {
          adminToken,
          winnerEmail,
        });

        return NextResponse.json({
          ...notifyResult
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = verifyAdminToken(req);
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'current_raffle':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentRaffle = await convex.action((api as unknown as any).entriesNode.getCurrentRaffle);
        return NextResponse.json({
          success: true,
          raffle: currentRaffle
        });

      case 'stats':
        const [raffleStats, stripeStats] = await Promise.all([
          convex.query(api.entries.getRaffleStats),
          convex.action(api.stripeActions.getStripeStats, { adminToken })
        ]);

        return NextResponse.json({
          success: true,
          stats: {
            raffle: raffleStats,
            payments: stripeStats
          }
        });

      case 'entries':
        const limit = parseInt(searchParams.get('limit') || '50');
        const cursor = searchParams.get('cursor');
        
        const entriesData = await convex.query(api.entries.getAllEntries, {
          limit,
          cursor: cursor || undefined
        });

        return NextResponse.json({
          success: true,
          ...entriesData
        });

      case 'leads':
        const leadLimit = parseInt(searchParams.get('limit') || '50');
        const leadCursor = searchParams.get('cursor');
        
        const leadsData = await convex.query(api.leads.getAllLeads, {
          limit: leadLimit,
          cursor: leadCursor || undefined
        });

        return NextResponse.json({
          success: true,
          ...leadsData
        });

      case 'payment_events':
        const eventLimit = parseInt(searchParams.get('limit') || '50');
        const eventType = searchParams.get('event_type');
        
        const paymentEvents = await convex.query(api.payments.getPaymentEvents, {
          limit: eventLimit,
          eventType: eventType || undefined
        });

        return NextResponse.json({
          success: true,
          events: paymentEvents
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin GET API error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
