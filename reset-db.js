const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all Decisions...");
  await prisma.decision.deleteMany({});
  
  console.log("Deleting all Workspaces...");
  await prisma.workspace.deleteMany({});
  
  console.log("Deleting all Users...");
  await prisma.user.deleteMany({});
  
  console.log("Database reset complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
