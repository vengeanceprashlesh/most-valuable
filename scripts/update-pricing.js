/**
 * Update raffle pricing to $50 per entry and 4 entries for $100
 * Run this with: node scripts/update-pricing.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function updateRafflePricing() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
    process.exit(1);
  }

  if (!process.env.ADMIN_TOKEN) {
    console.error('ADMIN_TOKEN environment variable is required');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  try {
    console.log('💰 Updating raffle pricing configuration...');
    
    // New pricing structure
    const newPricing = {
      adminToken: process.env.ADMIN_TOKEN,
      pricePerEntry: 5000, // $50.00 in cents
      bundlePrice: 10000,  // $100.00 in cents (4 entries for $100)
      bundleSize: 4,       // 4 entries bundle
    };
    
    console.log('📋 New Pricing Structure:');
    console.log('   Per Entry: $' + (newPricing.pricePerEntry / 100));
    console.log('   Bundle: ' + newPricing.bundleSize + ' entries for $' + (newPricing.bundlePrice / 100));
    console.log('   Bundle Savings: $' + ((newPricing.bundleSize * newPricing.pricePerEntry - newPricing.bundlePrice) / 100));
    
    // Get current raffle first
    const currentRaffle = await convex.action(api.entriesNode.getCurrentRaffle);
    
    if (!currentRaffle) {
      throw new Error('No active raffle found. Please run init-raffle-timer.js first.');
    }
    
    console.log('\n🚀 Updating raffle pricing...');
    
    // Use setupRaffle to update the existing raffle with new pricing
    const updatedConfig = {
      adminToken: process.env.ADMIN_TOKEN,
      name: currentRaffle.name,
      startDate: currentRaffle.startDate,
      endDate: currentRaffle.endDate,
      pricePerEntry: 5000, // $50.00 in cents
      bundlePrice: 10000,  // $100.00 in cents (4 entries for $100)
      bundleSize: 4,       // 4 entries bundle
      productName: currentRaffle.productName,
      productDescription: currentRaffle.productDescription,
    };
    
    const result = await convex.action(api.entriesNode.setupRaffle, updatedConfig);
    
    console.log('✅ Raffle pricing update successful!');
    console.log('📊 Updated configuration:', result);
    
    console.log('\n🎉 New pricing is now active!');
    console.log('💡 Updated pricing:');
    console.log('   • $50 per entry');
    console.log('   • 4 entries for $100 (save $100)');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Update frontend components to show new pricing');
    console.log('   2. Test purchasing with new amounts');
    console.log('   3. Verify Stripe checkout shows correct pricing');
    
  } catch (error) {
    console.error('❌ Error updating raffle pricing:', error.message);
    
    if (error.message.includes('not found')) {
      console.log('\n💡 Tip: Make sure the raffle configuration exists first.');
      console.log('   Run: node scripts/init-raffle-timer.js');
    }
    
    process.exit(1);
  }
}

updateRafflePricing();
