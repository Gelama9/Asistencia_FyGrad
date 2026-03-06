import { db } from '../db';
import { attendanceOverrides } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function testSave() {
  console.log('Testing database save...');
  try {
    const result = await db.insert(attendanceOverrides).values({
      userId: 'test-user',
      dateKey: '2026-03-06',
      blockType: 'morning',
      status: 'Puntual',
      notes: 'Test notes',
      paymentAmount: '0.00',
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [attendanceOverrides.userId, attendanceOverrides.dateKey, attendanceOverrides.blockType],
      set: {
        status: 'Puntual',
        notes: 'Test notes',
        paymentAmount: '0.00',
        updatedAt: new Date(),
      }
    }).returning();
    
    console.log('Save successful:', result);
    
    const check = await db.select()
      .from(attendanceOverrides)
      .where(eq(attendanceOverrides.userId, 'test-user'));
    console.log('Verification check:', check);
    
    // Cleanup
    await db.delete(attendanceOverrides).where(eq(attendanceOverrides.userId, 'test-user'));
    console.log('Cleanup done.');
  } catch (error) {
    console.error('Save failed:', error);
  }
}

testSave();

