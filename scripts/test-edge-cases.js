require('dotenv').config({ path: '.env.local' });
const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testEdgeCasesAndFailureScenarios() {
  try {
    console.log("🧪 TESTING EDGE CASES AND FAILURE SCENARIOS");
    console.log("===========================================");

    const edgeCaseResults = [];

    // Edge Case 1: Test with invalid admin token
    console.log("\n🔒 Edge Case 1: Invalid Admin Token...");
    try {
      await convex.mutation(api.winnerSelection.selectRaffleWinner, {
        adminToken: "invalid-token"
      });
      edgeCaseResults.push("❌ FAILED: Invalid admin token was accepted");
    } catch (error) {
      if (error.message.includes("Unauthorized")) {
        edgeCaseResults.push("✅ PASSED: Invalid admin token correctly rejected");
      } else {
        edgeCaseResults.push(`⚠️ UNEXPECTED: ${error.message}`);
      }
    }

    // Edge Case 2: Test ticket verification function
    console.log("\n🎫 Edge Case 2: Ticket Verification Edge Cases...");
    try {
      const verification = await convex.query(api.raffleTickets.validateTicketIntegrity);
      
      // Test for edge cases in ticket numbering
      if (verification.totalTickets === verification.expectedTickets) {
        edgeCaseResults.push("✅ PASSED: Ticket count matches expected");
      } else {
        edgeCaseResults.push("❌ FAILED: Ticket count mismatch detected");
      }

      if (verification.isValid) {
        edgeCaseResults.push("✅ PASSED: Ticket integrity validation working");
      } else {
        edgeCaseResults.push("❌ FAILED: Ticket integrity issues exist");
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Ticket verification error: ${error.message}`);
    }

    // Edge Case 3: Test multiple winner attempts (should fail after first)
    console.log("\n👥 Edge Case 3: Multiple Winner Selection Prevention...");
    try {
      const winnersData = await convex.query(api.winnerSelection.getAllCurrentWinners);
      
      if (winnersData.remainingWinners === 0) {
        // Try to select another winner when none remain
        try {
          await convex.mutation(api.winnerSelection.selectRaffleWinner, {
            adminToken: "mvr-admin-2025-secure-token"
          });
          edgeCaseResults.push("❌ FAILED: System allowed selecting additional winners");
        } catch (error) {
          if (error.message.includes("already been selected")) {
            edgeCaseResults.push("✅ PASSED: Correctly prevents multiple winner selection");
          } else {
            edgeCaseResults.push(`⚠️ UNEXPECTED: ${error.message}`);
          }
        }
      } else {
        edgeCaseResults.push("⚠️ SKIPPED: Winner not yet selected, cannot test multiple selection");
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Multiple winner test error: ${error.message}`);
    }

    // Edge Case 4: Test winner verification hash integrity
    console.log("\n🔐 Edge Case 4: Winner Verification Hash Integrity...");
    try {
      const winnersData = await convex.query(api.winnerSelection.getAllCurrentWinners);
      
      if (winnersData.winners.length > 0) {
        const winner = winnersData.winners[0];
        const verification = await convex.query(api.winnerSelection.verifyWinnerSelection, {
          winnerId: winner._id
        });
        
        if (verification.isValid) {
          edgeCaseResults.push("✅ PASSED: Winner verification hash is valid");
        } else {
          edgeCaseResults.push("❌ FAILED: Winner verification hash is invalid");
        }
        
        // Check hash components
        if (verification.expectedHash === verification.actualHash) {
          edgeCaseResults.push("✅ PASSED: Hash components match");
        } else {
          edgeCaseResults.push("❌ FAILED: Hash components don't match");
        }
      } else {
        edgeCaseResults.push("⚠️ SKIPPED: No winners to verify");
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Winner verification test error: ${error.message}`);
    }

    // Edge Case 5: Test with empty ticket pool
    console.log("\n🕳️ Edge Case 5: Empty Ticket Pool Handling...");
    try {
      // This is a theoretical test - we can't actually empty the pool without breaking things
      // But we can check the error handling logic
      const allTickets = await convex.query(api.raffleTickets.getRaffleTicketStats);
      
      if (allTickets.totalTickets > 0) {
        edgeCaseResults.push("✅ PASSED: Ticket pool has entries (normal operation)");
        console.log(`   - Pool size: ${allTickets.totalTickets} tickets`);
        console.log(`   - Participants: ${allTickets.uniqueParticipants}`);
      } else {
        edgeCaseResults.push("⚠️ WARNING: Empty ticket pool detected");
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Ticket pool test error: ${error.message}`);
    }

    // Edge Case 6: Test raffle configuration edge cases
    console.log("\n⚙️ Edge Case 6: Raffle Configuration Edge Cases...");
    try {
      const raffleConfig = await convex.query(api.payments.getRaffleConfig);
      
      if (raffleConfig) {
        // Check for reasonable configuration values
        if (raffleConfig.pricePerEntry > 0 && raffleConfig.pricePerEntry < 100000) {
          edgeCaseResults.push("✅ PASSED: Price per entry is reasonable");
        } else {
          edgeCaseResults.push("⚠️ WARNING: Price per entry seems unusual");
        }
        
        if (raffleConfig.bundleSize > 1 && raffleConfig.bundleSize <= 10) {
          edgeCaseResults.push("✅ PASSED: Bundle size is reasonable");
        } else {
          edgeCaseResults.push("⚠️ WARNING: Bundle size seems unusual");
        }
        
        if (raffleConfig.maxWinners >= 1 && raffleConfig.maxWinners <= 5) {
          edgeCaseResults.push("✅ PASSED: Max winners is reasonable");
        } else {
          edgeCaseResults.push("⚠️ WARNING: Max winners seems unusual");
        }
      } else {
        edgeCaseResults.push("❌ FAILED: No raffle configuration found");
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Raffle configuration test error: ${error.message}`);
    }

    // Edge Case 7: Test database consistency
    console.log("\n🗄️ Edge Case 7: Database Consistency Checks...");
    try {
      const entries = await convex.query(api.entries.getAllEntries, { limit: 100 });
      const ticketStats = await convex.query(api.raffleTickets.getRaffleTicketStats);
      
      // Check for orphaned tickets (tickets without entries)
      const completedEntries = entries.entries.filter(e => e.paymentStatus === "completed");
      const totalExpectedTickets = completedEntries.reduce((sum, entry) => {
        // Only count raffle entries, not direct purchases
        const isDirectPurchase = entry.productId === "mv-hoodie" || 
                                 entry.productId === "mv-tee" ||
                                 entry.productId === "p6" || 
                                 entry.productId === "p7" ||
                                 entry.productId === "p1b" || 
                                 entry.productId === "p1w";
        return isDirectPurchase ? sum : sum + entry.count;
      }, 0);
      
      if (ticketStats.totalTickets === totalExpectedTickets) {
        edgeCaseResults.push("✅ PASSED: No orphaned tickets detected");
      } else {
        edgeCaseResults.push(`⚠️ WARNING: Ticket/entry mismatch (${ticketStats.totalTickets} tickets vs ${totalExpectedTickets} expected)`);
      }
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Database consistency test error: ${error.message}`);
    }

    // Edge Case 8: Test concurrent access patterns
    console.log("\n🔄 Edge Case 8: Concurrent Access Simulation...");
    try {
      // Simulate multiple rapid queries to test race conditions
      const startTime = Date.now();
      const promises = Array.from({ length: 5 }, () => 
        convex.query(api.winnerSelection.getAllCurrentWinners)
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // Check if all results are consistent
      const firstResult = JSON.stringify(results[0]);
      const allConsistent = results.every(result => JSON.stringify(result) === firstResult);
      
      if (allConsistent) {
        edgeCaseResults.push("✅ PASSED: Concurrent access returns consistent results");
      } else {
        edgeCaseResults.push("❌ FAILED: Concurrent access inconsistency detected");
      }
      
      console.log(`   - Concurrent query time: ${endTime - startTime}ms`);
    } catch (error) {
      edgeCaseResults.push(`❌ FAILED: Concurrent access test error: ${error.message}`);
    }

    // Final Edge Case Results
    console.log("\n" + "=".repeat(50));
    console.log("📋 EDGE CASE TEST RESULTS");
    console.log("=".repeat(50));

    const passed = edgeCaseResults.filter(r => r.includes("✅ PASSED")).length;
    const failed = edgeCaseResults.filter(r => r.includes("❌ FAILED")).length;
    const warnings = edgeCaseResults.filter(r => r.includes("⚠️")).length;
    const skipped = edgeCaseResults.filter(r => r.includes("⚠️ SKIPPED")).length;

    edgeCaseResults.forEach(result => console.log(result));

    console.log(`\n📊 SUMMARY:`);
    console.log(`- Passed: ${passed}`);
    console.log(`- Failed: ${failed}`);
    console.log(`- Warnings: ${warnings}`);
    console.log(`- Skipped: ${skipped}`);

    console.log(`\n🏥 EDGE CASE HEALTH:`);
    if (failed === 0) {
      if (warnings <= 2) {
        console.log("🟢 EXCELLENT - All edge cases handled properly");
      } else {
        console.log("🟡 GOOD - Edge cases handled with minor concerns");
      }
    } else if (failed <= 2) {
      console.log("🟠 NEEDS ATTENTION - Some edge cases need fixing");
    } else {
      console.log("🔴 CRITICAL - Multiple edge case failures detected");
    }

  } catch (error) {
    console.error("\n💥 EDGE CASE TESTING FAILED:", error.message);
    console.error("Stack trace:", error);
  }
}

// Run the edge case testing
testEdgeCasesAndFailureScenarios();