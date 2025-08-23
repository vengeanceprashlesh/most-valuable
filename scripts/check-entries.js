require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEntries() {
  try {
    console.log('🔍 Checking entries in database...');
    
    const completedEntries = await prisma.entry.findMany({
      where: { status: 'completed' }
    });
    
    const totalCompleted = completedEntries.reduce((sum, entry) => sum + entry.quantity, 0);
    
    console.log(`📊 Completed entries: ${completedEntries.length} records`);
    console.log(`🎫 Total tickets: ${totalCompleted}`);
    
    if (completedEntries.length > 0) {
      console.log('\n📝 Entries details:');
      completedEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ID: ${entry.id}, Quantity: ${entry.quantity}, Email: ${entry.email}`);
      });
    } else {
      console.log('✅ No completed entries found - database is clean!');
    }
    
    // Check raffle config
    const raffleConfig = await prisma.raffleConfig.findFirst();
    if (raffleConfig) {
      console.log(`\n🎯 RaffleConfig totalEntries: ${raffleConfig.totalEntries}`);
      console.log(`🔧 Sync needed: ${raffleConfig.totalEntries !== totalCompleted ? 'YES' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEntries();
