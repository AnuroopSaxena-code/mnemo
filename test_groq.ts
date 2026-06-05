import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { groq, MODEL, synthesiseAnswer } from './lib/groq';

async function test() {
  try {
    const res = await synthesiseAnswer("test", []);
    console.log("Success:", res);
  } catch (e: any) {
    console.error("GROQ ERROR:", e.message);
  }
}
test();
