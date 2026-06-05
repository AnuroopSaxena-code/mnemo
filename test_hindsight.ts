import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { recall } from './lib/memory';

async function test() {
  try {
    const res = await recall("mnemo", "test");
    console.log("Success:", res.length);
  } catch (e: any) {
    console.error("HINDSIGHT ERROR:", e.message);
  }
}
test();
