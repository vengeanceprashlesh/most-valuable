/**
 * Reset winner selection - clears current winner so you can select again
 * Usage: node scripts/reset-winner-selection.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

require('dotenv').config({ path: '.env.local' });

async function resetWinnerSelection() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
    process.exit(1);
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

  try {
    console.log('🔄 RESETTING WINNER SELECTION...');
    console.log('This will clear the current winner and allow selecting a new one');
    
    // Check current winners
    const winnersData = await convex.query(api.winnerSelection.getAllCurrentWinners);
    console.log(`\n📊 Current Status:`);
    console.log(`   Winners Selected: ${winnersData.winners.length}`);
    console.log(`   Remaining Slots: ${winnersData.remainingWinners}`);
    
    if (winnersData.winners.length === 0) {
      console.log('✅ No winners to reset. Winner selection is already available.');
      return;
    }
    
    console.log(`\n🏆 Current Winners:`);
    winnersData.winners.forEach((winner, index) => {
      console.log(`   Winner ${index + 1}: ${winner.winnerEmail} (Ticket #${winner.winningTicketNumber})`);
      console.log(`   Selected: ${new Date(winner.selectedAt).toLocaleString()}`);
    });
    
    // Reset winner selection
    const result = await convex.mutation(api.winnerSelection.resetWinnerSelection, {
      adminToken: "mvr-admin-2025-secure-token",
      confirmReset: "CONFIRM_RESET_WINNERS"
    });
    
    console.log('\n✅ WINNER SELECTION RESET SUCCESSFUL!');
    console.log(`📊 Winners Removed: ${result.winnersRemoved}`);
    console.log(`🎯 Raffle: ${result.raffleName}`);
    console.log('\n🎉 You can now select a new winner through the admin dashboard!');
    console.log('🌐 Visit /admin and go to the "Winner Selection" tab');
    
  } catch (error) {
    console.error('❌ Error resetting winner selection:', error.message);
    process.exit(1);
  }
}

console.log('🔄 Reset Winner Selection');
console.log('────────────────────────────');

resetWinnerSelection();