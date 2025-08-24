/**
 * Update the raffle product name to "Gold Rush collection"
 * This will change what appears in Stripe checkout sessions
 * Run this with: node scripts/update-product-name.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function updateProductName() {
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
    console.log('🔄 Updating raffle product name to "Gold Rush collection"...');
    
    // Get current raffle configuration
    const currentRaffle = await convex.action(api.entriesNode.getCurrentRaffle);
    
    if (!currentRaffle) {
      console.error('❌ No active raffle found. Please run init-raffle-timer.js first.');
      process.exit(1);
    }

    console.log('📋 Current Configuration:');
    console.log('   Name:', currentRaffle.name);
    console.log('   Product:', currentRaffle.productName);
    console.log('   Start:', new Date(currentRaffle.startDate).toLocaleString());
    console.log('   End:', new Date(currentRaffle.endDate).toLocaleString());
    
    // Update the product name via the admin API
    const updateConfig = {
      adminToken: process.env.ADMIN_TOKEN,
      name: currentRaffle.name,
      startDate: currentRaffle.startDate,
      endDate: currentRaffle.endDate,
      pricePerEntry: currentRaffle.pricePerEntry,
      bundlePrice: currentRaffle.bundlePrice,
      bundleSize: currentRaffle.bundleSize,
      productName: "Gold Rush collection", // This is what we're changing
      productDescription: "Exclusive Gold Rush collection featuring premium quality items."
    };
    
    console.log('🚀 Applying update...');
    const result = await convex.action(api.entriesNode.setupRaffle, updateConfig);
    
    console.log('✅ Product name update successful!');
    console.log('🎯 New Configuration:');
    console.log('   Product Name: "Gold Rush collection"');
    console.log('   Description: "Exclusive Gold Rush collection featuring premium quality items."');
    
    console.log('\n🛍️ Stripe Checkout Impact:');
    console.log('   ✓ Single entries will show: "Gold Rush collection - 1 entry"');
    console.log('   ✓ Bundle entries will show: "Gold Rush collection - Bundle (4 entries)"');
    console.log('   ✓ Description will show: "X entries for Gold Rush collection"');
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Test a checkout to verify the new name appears');
    console.log('   2. The change takes effect immediately for new checkout sessions');
    console.log('   3. Old sessions will still show the previous name until they expire');
    
  } catch (error) {
    console.error('❌ Error updating product name:', error.message);
    
    if (error.message.includes('Invalid admin token')) {
      console.log('💡 Tip: Check your ADMIN_TOKEN in .env.local file');
    }
    
    process.exit(1);
  }
}

updateProductName();
