/**
 * DIRECT DATABASE FIX - Manually update totalEntries using admin functions
 * Run this with: node scripts/direct-fix.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function directFix() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  try {
    console.log('🔧 DIRECT DATABASE FIX - Updating totalEntries...');
    
    // Get current state
    const config = await convex.query(api.payments.getRaffleConfig);
    if (!config) {
      throw new Error('No raffle config found');
    }
    
    console.log(`📊 Current: ${config.totalEntries} entries (showing in frontend)`);
    
    // Get actual entries
    const entries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
    const completedEntries = entries?.entries?.filter(e => e.paymentStatus === "completed") || [];
    const actualTotal = completedEntries.reduce((sum, entry) => sum + entry.count, 0);
    
    console.log(`📊 Actual: ${actualTotal} completed entries (in database)`);
    
    if (config.totalEntries === actualTotal) {
      console.log('✅ Already in sync!');
      return;
    }
    
    console.log(`\n⚠️ SYNC ISSUE: ${config.totalEntries} ≠ ${actualTotal}`);
    console.log('🔧 Attempting direct admin update...');
    
    // Try using the update function with just admin fields
    try {
      const updateResult = await convex.mutation(api.initDatabase.updateRaffleConfig, {
        adminToken: "mvr-admin-2025-secure-token",
        // Let's try updating other fields to force a refresh
        isActive: true, // Keep it active
      });
      
      console.log('📝 Admin update result:', updateResult);
      
      // Check if this triggered any internal sync
      const updatedConfig = await convex.query(api.payments.getRaffleConfig);
      console.log(`📊 After update: ${updatedConfig.totalEntries} entries`);
      
      if (updatedConfig.totalEntries === actualTotal) {
        console.log('✅ FIXED! Sync is now correct.');
      } else {
        console.log('⚠️ Still needs manual fix via dashboard');
        console.log('\n🛠️ MANUAL FIX STEPS:');
        console.log('1. Open https://dashboard.convex.dev/');
        console.log('2. Go to your project → Data → raffleConfig table');
        console.log(`3. Edit the 'totalEntries' field from ${updatedConfig.totalEntries} to ${actualTotal}`);
        console.log('4. Save and refresh your shop page');
      }
      
    } catch (updateError) {
      console.log('❌ Admin update failed:', updateError.message);
      console.log('\n🛠️ MANUAL FIX REQUIRED:');
      console.log('1. Open https://dashboard.convex.dev/');
      console.log('2. Go to your project → Data → raffleConfig table');
      console.log(`3. Edit the 'totalEntries' field from ${config.totalEntries} to ${actualTotal}`);
      console.log('4. Save and refresh your shop page');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

directFix();
