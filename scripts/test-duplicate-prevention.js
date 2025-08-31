const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function testDuplicatePrevention() {
  try {
    console.log("🧪 Testing duplicate prevention logic...\n");

    const testEmail = `test-duplicate-${Date.now()}@test.com`;
    console.log(`Using test email: ${testEmail}`);

    // Test 1: First subscription (should create lead + free entry)
    console.log("\n📝 Test 1: First subscription attempt...");
    try {
      const result1 = await convex.mutation(api.leads.addLead, {
        email: testEmail,
        source: "test",
        ipAddress: "127.0.0.1"
      });
      console.log("✅ First subscription result:", result1);
    } catch (error) {
      console.error("❌ First subscription failed:", error.message);
      return;
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Second subscription attempt (should NOT create another free entry)
    console.log("\n📝 Test 2: Second subscription attempt (should NOT create duplicate free entry)...");
    try {
      const result2 = await convex.mutation(api.leads.addLead, {
        email: testEmail,
        source: "test",
        ipAddress: "127.0.0.1"
      });
      console.log("✅ Second subscription result:", result2);
    } catch (error) {
      console.error("❌ Second subscription failed:", error.message);
    }

    // Test 3: Check the database state
    console.log("\n📝 Test 3: Checking database state...");
    
    // Check lead count
    const lead = await convex.query(api.leads.getLead, { email: testEmail });
    console.log("Lead found:", !!lead);

    // Check entry count for this email
    const entries = await convex.query(api.entries.getEntriesByEmail, { email: testEmail });
    const freeEntries = entries.filter(e => e.amount === 0 && e.paymentStatus === "completed");
    
    console.log(`Total entries for ${testEmail}:`, entries.length);
    console.log(`Free entries for ${testEmail}:`, freeEntries.length);

    // Test 4: Direct entry creation attempt (should fail)
    console.log("\n📝 Test 4: Direct entry creation attempt (should fail for duplicate free entry)...");
    try {
      await convex.mutation(api.entries.addEntries, {
        email: testEmail,
        count: 1,
        amount: 0, // Free entry
        paymentStatus: "completed",
        ipAddress: "127.0.0.1",
        bundle: false
      });
      console.log("❌ PROBLEM: Direct entry creation should have failed but didn't!");
    } catch (error) {
      console.log("✅ Direct entry creation correctly blocked:", error.message);
    }

    // Summary
    console.log("\n📊 TEST SUMMARY:");
    console.log(`- Lead created: ${!!lead}`);
    console.log(`- Free entries for test email: ${freeEntries.length}`);
    console.log(`- Duplicate prevention working: ${freeEntries.length === 1 ? 'YES ✅' : 'NO ❌'}`);

    if (freeEntries.length === 1) {
      console.log("\n🎉 SUCCESS: Duplicate prevention is working correctly!");
    } else {
      console.log("\n🚨 FAILURE: Duplicate prevention is not working properly!");
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testDuplicatePrevention();
