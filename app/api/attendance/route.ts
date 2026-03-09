import { db } from '@/db';
import { attendance, devices } from '@/db/schema';
import { toZonedTime } from 'date-fns-tz';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID requerido' }, { status: 400, headers: corsHeaders });
        }

        // Fetch records for the device, ordered by timestamp desc
        const records = await db.select()
            .from(attendance)
            .where(eq(attendance.deviceId, deviceId))
            .orderBy(desc(attendance.timestamp))
            .limit(10);

        return NextResponse.json({ success: true, records }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: corsHeaders });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, deviceId, bssid, timestamp } = body;

        if (!action || !['ENTRADA', 'SALIDA'].includes(action)) {
            return NextResponse.json({ error: 'Acción inválida' }, { status: 400, headers: corsHeaders });
        }

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID requerido' }, { status: 400, headers: corsHeaders });
        }

        // 1. Ensure device exists in 'devices' table
        const existingDevice = await db.select()
            .from(devices)
            .where(eq(devices.deviceId, deviceId));

        if (existingDevice.length === 0) {
            await db.insert(devices).values({
                deviceId: deviceId,
                displayName: 'Nuevo Dispositivo'
            });
        }

        const targetBssid = bssid || 'Desconocido';
        const targetTimestamp = timestamp ? new Date(timestamp) : new Date();

        // 2. Insert into attendance
        const result = await db.insert(attendance).values({
            userId: deviceId, // legacy field name
            action: action,
            bssid: targetBssid,
            timestamp: targetTimestamp,
            deviceId: deviceId
        }).returning();

        return NextResponse.json({ success: true, record: result[0] }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Error recording attendance:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: corsHeaders });
    }
}

