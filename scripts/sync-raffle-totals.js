/**
 * Sync raffle totalEntries with actual completed entries in database
 * This fixes sync issues between frontend and backend
 * Run this with: node scripts/sync-raffle-totals.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function syncRaffleTotals() {
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
    console.log('🔄 Syncing raffle totals with actual database entries...');
    
    // Get current raffle config
    const raffleConfig = await convex.query(api.payments.getRaffleConfigInternal);
    if (!raffleConfig) {
      console.error('❌ No active raffle configuration found!');
      process.exit(1);
    }

    console.log(`📊 Current raffleConfig.totalEntries: ${raffleConfig.totalEntries}`);

    // Get all completed entries
    const allEntries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
    const completedEntries = allEntries?.entries?.filter(e => e.paymentStatus === "completed") || [];
    
    // Calculate actual total from completed entries
    const actualTotal = completedEntries.reduce((sum, entry) => sum + entry.count, 0);
    
    console.log(`📊 Actual completed entries total: ${actualTotal}`);
    console.log(`📊 Number of completed transactions: ${completedEntries.length}`);
    
    if (completedEntries.length > 0) {
      console.log('\n📝 Completed entries breakdown:');
      completedEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.email}: ${entry.count} entries ($${entry.amount / 100})`);
      });
    }

    // Check if sync is needed
    if (raffleConfig.totalEntries === actualTotal) {
      console.log('\n✅ Raffle totals are already in sync! No action needed.');
      return;
    }

    console.log(`\n⚠️  SYNC ISSUE DETECTED:`);
    console.log(`   raffleConfig.totalEntries: ${raffleConfig.totalEntries}`);
    console.log(`   Actual completed entries: ${actualTotal}`);
    console.log(`   Difference: ${raffleConfig.totalEntries - actualTotal}`);

    // Update raffleConfig to match actual totals
    console.log('\n🔧 Updating raffleConfig.totalEntries to match actual data...');
    
    // Use updateRaffleConfig mutation with totalEntries parameter
    const updateResult = await convex.mutation(api.initDatabase.updateRaffleConfig, {
      adminToken: "mvr-admin-2025-secure-token",
      totalEntries: actualTotal,
    });

    console.log(`✅ Successfully synced raffleConfig.totalEntries from ${raffleConfig.totalEntries} to ${actualTotal}!`);
    
    // Verify the update
    const updatedConfig = await convex.query(api.payments.getRaffleConfigInternal);
    console.log(`\n🔍 Verification:`);
    console.log(`   Updated raffleConfig.totalEntries: ${updatedConfig.totalEntries}`);
    console.log(`   Actual completed entries: ${actualTotal}`);
    console.log(`   ✅ Sync successful: ${updatedConfig.totalEntries === actualTotal}`);
    
    console.log('\n🎉 Raffle totals are now properly synced!');
    console.log('🌐 Frontend will now show the correct entry count.');
    
  } catch (error) {
    console.error('❌ Error syncing raffle totals:', error.message);
    process.exit(1);
  }
}

syncRaffleTotals();
