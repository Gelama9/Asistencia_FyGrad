import { db } from '../db';
import { lateFeeRules } from '../db/schema';

async function updateRules() {
  console.log('Updating late fee rules in database...');
  try {
    const newRules = [
      { blockType: 'morning', minMinutes: 10, maxMinutes: 20, feeAmount: '5.00' },
      { blockType: 'morning', minMinutes: 20, maxMinutes: 30, feeAmount: '10.00' },
      { blockType: 'morning', minMinutes: 30, maxMinutes: 60, feeAmount: '13.00' },
      { blockType: 'morning', minMinutes: 60, maxMinutes: null, feeAmount: '23.00' },
      { blockType: 'afternoon', minMinutes: 10, maxMinutes: 20, feeAmount: '5.00' },
      { blockType: 'afternoon', minMinutes: 20, maxMinutes: 30, feeAmount: '10.00' },
      { blockType: 'afternoon', minMinutes: 30, maxMinutes: 60, feeAmount: '13.00' },
      { blockType: 'afternoon', minMinutes: 60, maxMinutes: null, feeAmount: '23.00' },
    ];

    await db.delete(lateFeeRules);
    await db.insert(lateFeeRules).values(newRules);
    console.log('Rules updated successfully.');
  } catch (error) {
    console.error('Failed to update rules:', error);
  }
}

updateRules();
