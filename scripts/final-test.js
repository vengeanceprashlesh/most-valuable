const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function finalTest() {
  try {
    console.log("🧪 FINAL COMPREHENSIVE TEST - Duplicate Prevention System");
    console.log("=" .repeat(60));

    const testEmail = `final-test-${Date.now()}@test.com`;
    console.log(`\nUsing test email: ${testEmail}\n`);

    // Test 1: First subscription (should succeed and create free entry)
    console.log("📝 Test 1: First subscription attempt...");
    const result1 = await convex.mutation(api.leads.addLead, {
      email: testEmail,
      source: "final_test",
      ipAddress: "127.0.0.1"
    });
    console.log("✅ First subscription result:", result1);

    // Verify the first result structure
    if (result1.isNewLead && result1.leadId && !result1.alreadyHasFreeEntry) {
      console.log("✅ Correct response structure for new user");
    } else {
      console.log("❌ Incorrect response structure for new user");
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Second subscription attempt (should return existing lead info)
    console.log("\n📝 Test 2: Second subscription attempt (should NOT create duplicate)...");
    const result2 = await convex.mutation(api.leads.addLead, {
      email: testEmail,
      source: "final_test",
      ipAddress: "127.0.0.1"
    });
    console.log("✅ Second subscription result:", result2);

    // Verify the second result structure
    if (!result2.isNewLead && result2.leadId && result2.alreadyHasFreeEntry) {
      console.log("✅ Correct response structure for existing user");
    } else {
      console.log("❌ Incorrect response structure for existing user");
    }

    // Test 3: Direct entry creation (should fail)
    console.log("\n📝 Test 3: Direct free entry creation attempt (should fail)...");
    try {
      await convex.mutation(api.entries.addEntries, {
        email: testEmail,
        count: 1,
        amount: 0,
        paymentStatus: "completed",
        ipAddress: "127.0.0.1",
        bundle: false
      });
      console.log("❌ PROBLEM: Direct entry creation should have failed but succeeded!");
    } catch (error) {
      console.log("✅ Direct entry creation correctly blocked:", error.message);
    }

    // Test 4: Verify database state
    console.log("\n📝 Test 4: Database state verification...");
    const lead = await convex.query(api.leads.getLead, { email: testEmail });
    const entries = await convex.query(api.entries.getEntriesByEmail, { email: testEmail });
    const freeEntries = entries.filter(e => e.amount === 0 && e.paymentStatus === "completed");

    console.log(`✅ Lead exists: ${!!lead}`);
    console.log(`✅ Total entries: ${entries.length}`);
    console.log(`✅ Free entries: ${freeEntries.length}`);

    // Test 5: Paid entry creation (should succeed)
    console.log("\n📝 Test 5: Paid entry creation (should succeed)...");
    try {
      await convex.mutation(api.entries.addEntries, {
        email: testEmail,
        count: 1,
        amount: 5000, // $50.00
        paymentStatus: "completed",
        ipAddress: "127.0.0.1",
        bundle: false
      });
      console.log("✅ Paid entry creation succeeded");
    } catch (error) {
      console.log("❌ Paid entry creation failed:", error.message);
    }

    // Test 6: Final verification
    console.log("\n📝 Test 6: Final verification...");
    const finalEntries = await convex.query(api.entries.getEntriesByEmail, { email: testEmail });
    const finalFreeEntries = finalEntries.filter(e => e.amount === 0 && e.paymentStatus === "completed");
    const finalPaidEntries = finalEntries.filter(e => e.amount > 0 && e.paymentStatus === "completed");

    console.log(`✅ Final total entries: ${finalEntries.length}`);
    console.log(`✅ Final free entries: ${finalFreeEntries.length}`);
    console.log(`✅ Final paid entries: ${finalPaidEntries.length}`);

    // Test 7: Overall system check
    console.log("\n📝 Test 7: System-wide duplicate check...");
    const allEntries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
    const allFreeEntries = allEntries.entries.filter(entry => entry.amount === 0 && entry.paymentStatus === "completed");
    
    const emailGroups = {};
    allFreeEntries.forEach(entry => {
      const email = entry.email.toLowerCase();
      emailGroups[email] = (emailGroups[email] || 0) + 1;
    });

    const systemDuplicates = Object.entries(emailGroups).filter(([email, count]) => count > 1);
    console.log(`✅ System-wide duplicate check: ${systemDuplicates.length} emails with duplicates`);

    // Summary
    console.log("\n" + "=" .repeat(60));
    console.log("🎯 FINAL TEST SUMMARY:");
    console.log("=" .repeat(60));
    console.log(`✅ New user flow: ${result1.isNewLead ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Existing user flow: ${!result2.isNewLead && result2.alreadyHasFreeEntry ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Duplicate prevention: ${finalFreeEntries.length === 1 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Paid entries work: ${finalPaidEntries.length >= 1 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ System-wide clean: ${systemDuplicates.length === 0 ? 'PASS' : 'FAIL'}`);

    const allTestsPassed = (
      result1.isNewLead &&
      !result2.isNewLead &&
      result2.alreadyHasFreeEntry &&
      finalFreeEntries.length === 1 &&
      finalPaidEntries.length >= 1 &&
      systemDuplicates.length === 0
    );

    if (allTestsPassed) {
      console.log("\n🎉 ALL TESTS PASSED! Duplicate prevention system is working perfectly!");
    } else {
      console.log("\n🚨 SOME TESTS FAILED! Please review the system implementation.");
    }

    console.log("=" .repeat(60));

  } catch (error) {
    console.error("\n❌ Final test failed:", error);
  }
}

finalTest();
