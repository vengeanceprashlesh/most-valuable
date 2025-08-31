const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");
require("dotenv").config({ path: ".env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkDuplicateEntries() {
  try {
    console.log("🔍 Checking for duplicate free raffle entries...\n");

    // Get all entries with amount = 0 (free entries)
    const allEntries = await convex.query(api.entries.getAllEntries, { limit: 1000 });
    const freeEntries = allEntries.entries.filter(entry => entry.amount === 0 && entry.paymentStatus === "completed");
    
    console.log(`Total free entries found: ${freeEntries.length}`);
    
    // Group entries by email
    const emailGroups = {};
    freeEntries.forEach(entry => {
      const email = entry.email.toLowerCase();
      if (!emailGroups[email]) {
        emailGroups[email] = [];
      }
      emailGroups[email].push(entry);
    });

    // Find duplicates
    const duplicates = Object.entries(emailGroups).filter(([email, entries]) => entries.length > 1);
    
    console.log(`\n📊 RESULTS:`);
    console.log(`- Unique emails with free entries: ${Object.keys(emailGroups).length}`);
    console.log(`- Emails with duplicate free entries: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log(`\n🚨 DUPLICATE FREE ENTRIES FOUND:`);
      duplicates.forEach(([email, entries]) => {
        console.log(`\n📧 ${email}: ${entries.length} free entries`);
        entries.forEach((entry, index) => {
          const date = new Date(entry.createdAt).toLocaleString();
          console.log(`  ${index + 1}. ID: ${entry._id} | Created: ${date} | Count: ${entry.count}`);
        });
      });
      
      // Count total duplicate entries to be removed
      const totalDuplicates = duplicates.reduce((sum, [email, entries]) => sum + (entries.length - 1), 0);
      console.log(`\n⚡ Total duplicate entries to be cleaned up: ${totalDuplicates}`);
    } else {
      console.log(`\n✅ No duplicate free entries found!`);
    }

  } catch (error) {
    console.error("❌ Error checking duplicate entries:", error);
  }
}

checkDuplicateEntries();
