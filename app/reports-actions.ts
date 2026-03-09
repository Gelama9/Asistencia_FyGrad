'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { attendanceOverrides, lateFeeRules, employeeMonthlySummaries } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function saveStatusOverride(formData: FormData) {
  const userId = formData.get('userId') as string;
  const dateKey = formData.get('dateKey') as string;
  const blockType = formData.get('blockType') as string;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;
  const paymentAmount = formData.get('paymentAmount') as string || '0';
  const inTimeStr = formData.get('inTime') as string;
  const outTimeStr = formData.get('outTime') as string;

  if (!userId || !dateKey || !blockType) return { error: 'Missing data' };

  const inTime = inTimeStr ? new Date(inTimeStr) : null;
  const outTime = outTimeStr ? new Date(outTimeStr) : null;

  try {
    await db.insert(attendanceOverrides).values({
      userId,
      dateKey,
      blockType,
      status,
      notes,
      paymentAmount: paymentAmount,
      inTime,
      outTime,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [attendanceOverrides.userId, attendanceOverrides.dateKey, attendanceOverrides.blockType],
      set: {
        status,
        notes,
        paymentAmount: paymentAmount,
        inTime,
        outTime,
        updatedAt: new Date(),
      }
    });
    
    revalidatePath('/reports/monthly');
    return { success: true };
  } catch (error) {
    console.error('Error saving override:', error);
    return { error: 'Database error' };
  }
}

export async function updateLateFeeRules(rules: any[]) {
  try {
    // Delete old rules and insert new ones
    await db.delete(lateFeeRules);
    
    if (rules.length > 0) {
      await db.insert(lateFeeRules).values(rules.map(r => ({
        blockType: r.block_type,
        minMinutes: r.min_minutes,
        maxMinutes: r.max_minutes,
        feeAmount: r.fee_amount.toString(),
      })));
    }

    revalidatePath('/reports/monthly');
    return { success: true };
  } catch (error) {
    console.error('Error updating rules:', error);
    return { error: 'Database error' };
  }
}

export async function getLateFeeRules() {
  try {
    const rules = await db.select().from(lateFeeRules).orderBy(lateFeeRules.blockType, lateFeeRules.minMinutes);
    // Convert Drizzle objects back to match existing UI expectations if needed
    // The UI uses block_type, min_minutes etc.
    const mapped = rules.map(r => ({
      ...r,
      block_type: r.blockType,
      min_minutes: r.minMinutes,
      max_minutes: r.maxMinutes,
      fee_amount: r.feeAmount
    }));
    return { success: true, rules: mapped };
  } catch (error) {
    return { error: 'Database error' };
  }
}

export async function updateEmployeeMonthlySummary(formData: FormData) {
  const userId = formData.get('userId') as string;
  const monthKey = formData.get('monthKey') as string;
  const advanceAmount = formData.get('advanceAmount') as string || '0';
  const regularizeAmount = formData.get('regularizeAmount') as string || '0';
  const notes = formData.get('notes') as string || '';

  if (!userId || !monthKey) return { error: 'Missing data' };

  try {
    await db.insert(employeeMonthlySummaries).values({
      userId,
      monthKey,
      advanceAmount: advanceAmount,
      regularizeAmount: regularizeAmount,
      notes,
    }).onConflictDoUpdate({
      target: [employeeMonthlySummaries.userId, employeeMonthlySummaries.monthKey],
      set: {
        advanceAmount: advanceAmount,
        regularizeAmount: regularizeAmount,
        notes,
      }
    });
    
    revalidatePath('/reports/payroll');
    return { success: true };
  } catch (error) {
    console.error('Error updating summary:', error);
    return { error: 'Database error' };
  }
}

