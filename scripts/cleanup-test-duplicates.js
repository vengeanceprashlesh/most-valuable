const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function cleanupTestDuplicates() {
  try {
    console.log("🧹 Cleaning up test duplicate entries...\n");

    // Get all entries
    const allEntries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
    const freeEntries = allEntries.entries.filter(entry => entry.amount === 0 && entry.paymentStatus === "completed");
    
    // Group by email to find duplicates
    const emailGroups = {};
    freeEntries.forEach(entry => {
      const email = entry.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(entry);
    });

    // Find duplicates (including test emails)
    const duplicates = Object.entries(emailGroups).filter(([email, entries]) => entries.length > 1);
    
    console.log(`Found ${duplicates.length} emails with duplicate free entries:`);
    
    for (const [email, entries] of duplicates) {
      console.log(`\n📧 ${email}: ${entries.length} free entries`);
      
      // Sort by creation time (oldest first)
      entries.sort((a, b) => a.createdAt - b.createdAt);
      
      // Keep the first (oldest) entry, remove the rest
      const toKeep = entries[0];
      const toRemove = entries.slice(1);
      
      console.log(`  ✅ Keeping: ${toKeep._id} (created: ${new Date(toKeep.createdAt).toLocaleString()})`);
      
      for (const entry of toRemove) {
        console.log(`  🗑️ Would remove: ${entry._id} (created: ${new Date(entry.createdAt).toLocaleString()})`);
        // Note: Convex doesn't allow deletion via HTTP client, this would need to be done in the Convex dashboard
        // or through a proper mutation that we'd need to create
      }
    }

    if (duplicates.length === 0) {
      console.log("✅ No duplicates found to clean up!");
    } else {
      console.log(`\n⚠️ Found ${duplicates.length} email(s) with duplicates.`);
      console.log("Note: To actually remove duplicates, you would need to:");
      console.log("1. Create a cleanup mutation in Convex");
      console.log("2. Or manually delete from the Convex dashboard");
      console.log("3. Or use the Convex CLI with proper delete mutations");
    }

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

cleanupTestDuplicates();
