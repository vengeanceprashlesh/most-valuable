const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require('dotenv').config({ path: '.env.local' });

async function verifyPrices() {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
        console.error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
        process.exit(1);
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

    const testCases = [
        { id: 'raffle', expectedAmount: 10000, name: 'First Shirt (Raffle)' },
        { id: 'mv-hoodie', expectedAmount: 170000, name: 'MV Hoodie' },
        { id: 'mv-tee', expectedAmount: 35000, name: 'MV Tee' },
        { id: 'p6', expectedAmount: 170000, name: 'Box Logo Hoodie' },
        { id: 'p1b', expectedAmount: 35000, name: 'Box Logo Tee Black' },
    ];

    console.log('🔍 Verifying Prices...');
    let failures = 0;

    for (const test of testCases) {
        try {
            // Mock arguments for createCheckoutSession
            const args = {
                count: 1, // Not used for direct purchase logic but required by schema
                successUrl: 'http://localhost:3000/success',
                cancelUrl: 'http://localhost:3000/cancel',
                productId: test.id,
                purchaseType: 'direct', // Force direct to trigger that logic path, though productId should also trigger it
            };

            // We can't easily retrieve the session details without a real stripe key in this script context 
            // if the action actually creates a stripe session. 
            // However, the action returns { sessionId, url, amount, count }.
            // So we can verify the 'amount' field in the return value.

            // Note: The action creates a real stripe session. If STRIPE_SECRET_KEY is valid in .env.local, this will work.
            // If it fails due to stripe key, we'll see the error.

            const result = await convex.action(api.stripeActions.createCheckoutSession, args);

            if (result.amount === test.expectedAmount) {
                console.log(`✅ MATCH: ${test.name} (${test.id}) -> $${result.amount / 100}`);
            } else {
                console.error(`❌ MISMATCH: ${test.name} (${test.id}) -> Got $${result.amount / 100}, Expected $${test.expectedAmount / 100}`);
                failures++;
            }

        } catch (error) {
            console.error(`❌ ERROR: ${test.name} (${test.id}) -> ${error.message}`);
            failures++;
        }
    }

    if (failures === 0) {
        console.log('\n✨ All price verifications PASSED!');
    } else {
        console.log(`\n⚠️ ${failures} price verifications FAILED.`);
        process.exit(1);
    }
}

verifyPrices();
