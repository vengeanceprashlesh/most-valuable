/**
 * Setup script to create a raffle configuration
 * Run this with: node scripts/setup-raffle.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function setupRaffle() {
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
    console.log('Setting up raffle configuration...');
    
    // Calculate dates
    const startDate = new Date('2025-08-18T00:00:00Z').getTime();
    const endDate = new Date('2025-12-31T23:59:59Z').getTime(); // End of year
    
    const raffleConfig = {
      adminToken: process.env.ADMIN_TOKEN,
      name: "Most Valuable Holiday Raffle 2025",
      startDate: startDate,
      endDate: endDate,
      pricePerEntry: 5000, // $50.00 in cents
      bundlePrice: 10000, // $100.00 in cents (4 entries for $100)
      bundleSize: 4,
      productName: "Most Valuable Holiday Collection",
      productDescription: "Premium holiday merchandise collection"
    };

    console.log('Raffle Configuration:');
    console.log('- Name:', raffleConfig.name);
    console.log('- Start:', new Date(raffleConfig.startDate).toISOString());
    console.log('- End:', new Date(raffleConfig.endDate).toISOString());
    console.log('- Price per entry: $' + (raffleConfig.pricePerEntry / 100));
    console.log('- Bundle: ' + raffleConfig.bundleSize + ' entries for $' + (raffleConfig.bundlePrice / 100));
    
    const result = await convex.action(api.entriesNode.setupRaffle, raffleConfig);
    
    console.log('✅ Raffle setup successful!');
    console.log('Raffle ID:', result);
    
  } catch (error) {
    console.error('❌ Error setting up raffle:', error.message);
    process.exit(1);
  }
}

setupRaffle();
