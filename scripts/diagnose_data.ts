import { db } from '@/db/index';
import { attendance, devices, schedules } from '@/db/schema';
import { desc } from 'drizzle-orm';

async function diagnose() {
  console.log('--- Starting Diagnostics ---');
  
  try {
    const allDevices = await db.select().from(devices);
    console.log('\n--- Devices ---');
    allDevices.forEach((d: any) => {
      console.log(`ID: ${d.deviceId} | Name: ${d.displayName} | Salary: ${d.salaryPerBlock}`);
    });

    const allAttendance = await db.select().from(attendance).orderBy(desc(attendance.timestamp)).limit(20);
    console.log('\n--- Recent Attendance Records (Last 20) ---');
    allAttendance.forEach((a: any) => {
      console.log(`${a.deviceId} | Action: ${a.action} | Timestamp: ${a.timestamp.toISOString()}`);
    });

    const allSchedules = await db.select().from(schedules);
    console.log('\n--- Schedules ---');
    allSchedules.forEach((s: any) => {
      console.log(`User: ${s.userId} | Day: ${s.dayOfWeek} (0=Sun) | Block: ${s.blockType}`);
    });

  } catch (error) {
    console.error('Error during diagnostics:', error);
  }
}

diagnose().catch(console.error);



