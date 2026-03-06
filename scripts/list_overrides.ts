import { db } from '../db';
import { attendanceOverrides } from '../db/schema';

async function listOverrides() {
  console.log('Listing current overrides...');
  try {
    const overrides = await db.select().from(attendanceOverrides).limit(20);
    console.log('Overrides:', JSON.stringify(overrides, null, 2));
  } catch (error) {
    console.error('List failed:', error);
  }
}

listOverrides();

