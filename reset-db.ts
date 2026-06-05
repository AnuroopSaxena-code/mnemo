import { config } from 'dotenv';
config({ path: '.env.development.local' });
import { db } from './lib/db';

async function main() {
  console.log("Deleting all Decisions...");
  await db.decision.deleteMany({});
  
  console.log("Deleting all Workspaces...");
  await db.workspace.deleteMany({});
  
  console.log("Deleting all Users...");
  await db.user.deleteMany({});
  
  console.log("Database reset complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
