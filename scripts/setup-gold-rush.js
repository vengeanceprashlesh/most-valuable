/**
 * Setup Gold Rush collection with timer starting August 31st but payments working immediately
 * Run this with: node scripts/setup-gold-rush.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function setupGoldRushCollection() {
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
    console.log('🏆 Setting up Gold Rush collection...');
    
    // Timer shows countdown from August 31st, 2025
    const timerStartDate = new Date('2025-08-31T00:00:00Z').getTime();
    // 22 days duration as requested
    const endDate = new Date(timerStartDate + (22 * 24 * 60 * 60 * 1000)).getTime();
    
    // CRITICAL: Payment acceptance starts immediately (now)
    // But timer display starts from August 31st
    const paymentStartDate = Date.now(); // Allow payments immediately
    
    const raffleConfig = {
      adminToken: process.env.ADMIN_TOKEN,
      name: "Gold Rush Collection 2025",
      startDate: timerStartDate, // Timer logic date (August 31st)
      endDate: endDate, // Timer ends 22 days after August 31st
      timerDisplayDate: timerStartDate, // When timer starts showing countdown
      paymentStartDate: paymentStartDate, // When payments are accepted (immediately)
      pricePerEntry: 2500, // $25.00 in cents
      bundlePrice: 10000, // $100.00 in cents (4 entries for $100)
      bundleSize: 4,
      productName: "Gold Rush collection",
      productDescription: "Exclusive Gold Rush collection featuring premium quality items and the chance to win 2 winners!",
      maxWinners: 2 // Enable selecting 2 winners
    };

    console.log('📅 Gold Rush Configuration:');
    console.log('- Collection Name:', raffleConfig.name);
    console.log('- Product:', raffleConfig.productName);
    console.log('- Payments Start:', new Date(raffleConfig.paymentStartDate).toISOString(), '(IMMEDIATE)');
    console.log('- Timer Display Start:', new Date(raffleConfig.timerDisplayDate).toISOString(), '(August 31st)');
    console.log('- End Date:', new Date(raffleConfig.endDate).toISOString());
    console.log('- Duration: 22 days from August 31st');
    console.log('- Price per entry: $' + (raffleConfig.pricePerEntry / 100));
    console.log('- Bundle: ' + raffleConfig.bundleSize + ' entries for $' + (raffleConfig.bundlePrice / 100));
    console.log('- Two Winners: YES (to be selected)');
    
    const result = await convex.action(api.entriesNode.setupRaffle, raffleConfig);
    
    console.log('✅ Gold Rush collection setup successful!');
    console.log('🎯 Collection ID:', result);
    
    console.log('\n🎉 CRITICAL FIXES APPLIED:');
    console.log('   ✅ Payments work IMMEDIATELY (no date restrictions)');
    console.log('   ✅ Timer shows countdown from August 31st');
    console.log('   ✅ 22-day duration maintained');
    console.log('   ✅ Two winners selection enabled');
    console.log('   ✅ Gold Rush branding applied');
    
    console.log('\n🧪 Test Instructions:');
    console.log('   1. Visit /shop - timer should show "starts soon" or countdown');
    console.log('   2. Try purchasing entries - should work immediately');
    console.log('   3. Complete Stripe checkout - should process successfully');
    
  } catch (error) {
    console.error('❌ Error setting up Gold Rush collection:', error.message);
    process.exit(1);
  }
}

setupGoldRushCollection();
