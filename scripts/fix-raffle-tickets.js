require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function fixRaffleTickets() {
  try {
    console.log("🎫 FIXING RAFFLE TICKETS SYSTEM");
    console.log("================================");

    // Step 1: Validate current ticket integrity
    console.log("\n📊 Step 1: Checking current ticket integrity...");
    const integrityCheck = await convex.query(api.raffleTickets.validateTicketIntegrity);
    
    console.log(`Current Status:`);
    console.log(`- Total Tickets: ${integrityCheck.totalTickets}`);
    console.log(`- Expected Tickets: ${integrityCheck.expectedTickets}`);
    console.log(`- Total Entries: ${integrityCheck.totalEntries || 'N/A'}`);
    console.log(`- Raffle Entries: ${integrityCheck.raffleEntries || 'N/A'}`);
    console.log(`- Direct Purchases: ${integrityCheck.directPurchases || 'N/A'}`);
    console.log(`- Is Valid: ${integrityCheck.isValid ? '✅' : '❌'}`);
    
    if (integrityCheck.issues && integrityCheck.issues.length > 0) {
      console.log(`\n🚨 Issues Found:`);
      integrityCheck.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (integrityCheck.isValid) {
      console.log("\n✅ Ticket system is already valid! No fixes needed.");
      return;
    }

    // Step 2: Rebuild all raffle tickets
    console.log("\n🔧 Step 2: Rebuilding all raffle tickets...");
    console.log("⚠️  This will delete and recreate all raffle tickets!");
    
    const rebuildResult = await convex.mutation(api.raffleTickets.rebuildAllRaffleTickets, {
      adminToken: "mvr-admin-2025-secure-token"
    });

    console.log("\n🎯 REBUILD RESULTS:");
    console.log(`- Deleted Old Tickets: ${rebuildResult.deletedTickets}`);
    console.log(`- Reassigned Tickets: ${rebuildResult.reassignedTickets}`);
    console.log(`- Raffle Entries Processed: ${rebuildResult.totalRaffleEntries}`);
    console.log(`- Direct Purchases Skipped: ${rebuildResult.totalDirectPurchases}`);
    console.log(`- Final Ticket Range: ${rebuildResult.finalTicketRange}`);

    // Step 3: Verify the fix
    console.log("\n✅ Step 3: Verifying the fix...");
    const verifyCheck = await convex.query(api.raffleTickets.validateTicketIntegrity);
    
    console.log(`\nFinal Status:`);
    console.log(`- Total Tickets: ${verifyCheck.totalTickets}`);
    console.log(`- Expected Tickets: ${verifyCheck.expectedTickets}`);
    console.log(`- Is Valid: ${verifyCheck.isValid ? '✅' : '❌'}`);
    
    if (verifyCheck.issues && verifyCheck.issues.length > 0) {
      console.log(`\n🚨 Remaining Issues:`);
      verifyCheck.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log("\n🎉 SUCCESS! Raffle ticket system is now fully operational!");
      console.log("🏆 Winner selection should now work correctly.");
    }

  } catch (error) {
    console.error("\n❌ ERROR during ticket fix:", error.message);
    console.error("Stack trace:", error);
  }
}

// Run the fix
fixRaffleTickets();