const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function runCleanup() {
  try {
    console.log("🧹 Running duplicate free entries cleanup...\n");

    const result = await convex.mutation(api.entries.cleanupDuplicateFreeEntries, {});
    
    console.log("✅ Cleanup completed!");
    console.log(`- Emails with duplicates found: ${result.duplicateEmailsFound}`);
    console.log(`- Duplicate entries removed: ${result.entriesRemoved}`);
    
    if (result.cleanedEmails.length > 0) {
      console.log("\n📧 Cleaned emails:");
      result.cleanedEmails.forEach(email => {
        console.log(`  - ${email}`);
      });
    }

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

runCleanup();
