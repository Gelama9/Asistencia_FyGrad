'use server';

import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { attendance, attendanceOverrides, employeeMonthlySummaries, devices } from '@/db/schema';

export async function updateDevice(formData: FormData) {
    const oldId = formData.get('oldId') as string;
    const newId = formData.get('newId') as string;
    const newName = formData.get('newName') as string;
    const newSalary = formData.get('newSalary') as string;

    if (oldId && newId && newName) {
        if (oldId === newId) {
            // Simple name/salary update
            await db.update(devices)
                .set({ 
                    displayName: newName,
                    salaryPerBlock: newSalary
                })
                .where(eq(devices.deviceId, oldId));
        } else {
            // Comprehensive ID migration
            await db.transaction(async (tx) => {
                // 1. Create new device record
                await tx.insert(devices).values({
                    deviceId: newId,
                    displayName: newName,
                    salaryPerBlock: newSalary,
                    createdAt: new Date(), // Could also copy old createdAt if needed
                });

                // 2. Migrate related data
                await tx.update(attendance).set({ deviceId: newId, userId: newId }).where(eq(attendance.deviceId, oldId));
                await tx.update(attendanceOverrides).set({ userId: newId }).where(eq(attendanceOverrides.userId, oldId));
                await tx.update(employeeMonthlySummaries).set({ userId: newId }).where(eq(employeeMonthlySummaries.userId, oldId));

                // 3. Delete old device record
                await tx.delete(devices).where(eq(devices.deviceId, oldId));
            });
        }
        revalidatePath('/');
        revalidatePath('/devices');
        revalidatePath('/reports/monthly');
        revalidatePath('/reports/payroll');
        return { success: true };
    }
    return { error: 'Missing data' };
}
export async function createDevice(formData: FormData) {
    const deviceId = formData.get('deviceId') as string;
    const displayName = formData.get('displayName') as string;
    const salaryPerBlock = formData.get('salaryPerBlock') as string;
    
    if (deviceId && displayName) {
        await db.insert(devices).values({
            deviceId,
            displayName,
            salaryPerBlock,
            createdAt: new Date(),
        }).onConflictDoUpdate({
            target: [devices.deviceId],
            set: { displayName, salaryPerBlock }
        });
        revalidatePath('/');
        revalidatePath('/devices');
        return { success: true };
    }
    return { error: 'Missing data' };
}

export async function deleteDevice(formData: FormData) {
    const deviceId = formData.get('deviceId') as string;
    if (deviceId) {
        await db.delete(devices).where(eq(devices.deviceId, deviceId));
        revalidatePath('/');
        revalidatePath('/devices');
        return { success: true };
    }
    return { error: 'Missing data' };
}
