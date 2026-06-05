import { db } from './lib/db';
async function test() {
  try {
    await db.workspace.findFirst();
    console.log('success');
  } catch(e: any) {
    console.error('DB ERROR:', e.message);
  }
}
test();
