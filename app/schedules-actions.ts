'use server';

import { db } from '@/db';
import { schedules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getSchedules() {
  try {
    return await db.select().from(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export async function toggleSchedule(userId: string, dayOfWeek: number, blockType: 'morning' | 'afternoon') {
  try {
    const existing = await db.select()
      .from(schedules)
      .where(and(
        eq(schedules.userId, userId),
        eq(schedules.dayOfWeek, dayOfWeek),
        eq(schedules.blockType, blockType)
      ));

    if (existing.length > 0) {
      await db.delete(schedules)
        .where(and(
          eq(schedules.userId, userId),
          eq(schedules.dayOfWeek, dayOfWeek),
          eq(schedules.blockType, blockType)
        ));
    } else {
      await db.insert(schedules).values({
        userId,
        dayOfWeek,
        blockType
      });
    }
    
    revalidatePath('/schedules');
    revalidatePath('/reports/monthly');
    return { success: true };
  } catch (error) {
    console.error('Error toggling schedule:', error);
    return { success: false, error: 'Failed to update schedule' };
  }
}
