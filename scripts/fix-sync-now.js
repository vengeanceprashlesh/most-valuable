/**
 * IMMEDIATE SYNC FIX - Uses the deployed robustSync functions
 * Run this with: node scripts/fix-sync-now.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function fixSyncNow() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  try {
    console.log('🔧 Attempting to auto-fix sync issues...');
    
    // Try to use the robust sync system
    try {
      console.log('📊 Getting real raffle stats...');
      const realStats = await convex.query(api.robustSync.getRealRaffleStats);
      
      if (realStats) {
        console.log(`✅ Real stats retrieved:`);
        console.log(`   Real Total Entries: ${realStats.totalEntries}`);
        console.log(`   Stored Total Entries: ${realStats.syncStatus.storedTotal}`);
        console.log(`   Sync Needed: ${realStats.syncStatus.needsSync}`);
        
        if (realStats.syncStatus.needsSync) {
          console.log('\n🔧 Auto-fixing sync issue...');
          const fixResult = await convex.mutation(api.robustSync.autoFixSyncIssues);
          
          if (fixResult.success) {
            console.log('✅ SYNC FIXED SUCCESSFULLY!');
            console.log(`   Previous: ${fixResult.previousTotal}`);
            console.log(`   New: ${fixResult.newTotal}`);
            console.log('\n🎉 Frontend will now show the correct entry count!');
          } else {
            console.log('❌ Failed to auto-fix:', fixResult.error || 'Unknown error');
          }
        } else {
          console.log('✅ Already in sync! No fix needed.');
        }
      } else {
        console.log('❌ Could not retrieve real stats');
      }
    } catch (robustError) {
      console.log('⚠️ Robust sync functions not available, trying direct approach...');
      console.log('Error:', robustError.message);
      
      // Fallback: Direct database query and manual fix
      console.log('\n🔧 Attempting direct database fix...');
      
      // Get current config
      const config = await convex.query(api.payments.getRaffleConfig);
      if (!config) {
        throw new Error('No raffle config found');
      }
      
      console.log(`Current displayed entries: ${config.totalEntries}`);
      
      // Get actual entries
      const entries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
      const completedEntries = entries?.entries?.filter(e => e.paymentStatus === "completed") || [];
      const actualTotal = completedEntries.reduce((sum, entry) => sum + entry.count, 0);
      
      console.log(`Actual completed entries: ${actualTotal}`);
      
      if (config.totalEntries !== actualTotal) {
        console.log(`\n⚠️ SYNC ISSUE DETECTED: ${config.totalEntries} ≠ ${actualTotal}`);
        console.log('🛠️ Manual fix required via Convex dashboard:');
        console.log(`   1. Go to https://dashboard.convex.dev/`);
        console.log(`   2. Navigate to Data → raffleConfig table`);
        console.log(`   3. Find the active raffle record`);
        console.log(`   4. Edit 'totalEntries' field from ${config.totalEntries} to ${actualTotal}`);
        console.log(`   5. Save the change`);
        console.log('   6. Refresh your shop page');
      } else {
        console.log('✅ Already in sync!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSyncNow();
