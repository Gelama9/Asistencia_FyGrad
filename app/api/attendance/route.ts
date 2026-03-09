import { db } from '@/db';
import { attendance, devices, attendanceOverrides } from '@/db/schema';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { desc, eq, and, gte, lte } from 'drizzle-orm';
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

        const now = new Date();
        const limaNow = toZonedTime(now, 'America/Lima');
        const dateKey = formatInTimeZone(now, 'America/Lima', 'yyyy-MM-dd');
        const hour = limaNow.getHours();

        // 1. Check for overrides for today
        const overrides = await db.select()
            .from(attendanceOverrides)
            .where(and(
                eq(attendanceOverrides.userId, deviceId),
                eq(attendanceOverrides.dateKey, dateKey)
            ));

        // 2. Fetch latest raw records for today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const lastRecords = await db.select()
            .from(attendance)
            .where(and(
                eq(attendance.deviceId, deviceId),
                gte(attendance.timestamp, todayStart),
                lte(attendance.timestamp, todayEnd)
            ))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        let isCheckedIn = false;
        let suggestedAction: 'ENTRADA' | 'SALIDA' = 'ENTRADA';

        // Logic to determine status
        // Prioritize afternoon block if it's late, otherwise morning
        const blockType = hour >= 13 ? 'afternoon' : 'morning';
        const ov = overrides.find(o => o.blockType === blockType) || overrides.find(o => o.blockType === (blockType === 'morning' ? 'afternoon' : 'morning'));

        if (ov) {
            // If there's an override, follow its state
            if (ov.inTime && !ov.outTime) {
                isCheckedIn = true;
                suggestedAction = 'SALIDA';
            } else if (ov.inTime && ov.outTime) {
                isCheckedIn = false;
                suggestedAction = 'ENTRADA';
            } else if (ov.status === 'Inasistencia') {
                isCheckedIn = false;
                suggestedAction = 'ENTRADA';
            }
        } else if (lastRecords.length > 0) {
            const last = lastRecords[0];
            if (last.action === 'ENTRADA') {
                isCheckedIn = true;
                suggestedAction = 'SALIDA';
            } else {
                isCheckedIn = false;
                suggestedAction = 'ENTRADA';
            }
        }

        return NextResponse.json({ 
            success: true, 
            isCheckedIn, 
            suggestedAction,
            lastAction: lastRecords[0]?.action || null
        }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Error fetching attendance history:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500, headers: corsHeaders });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, bssid, timestamp } = body;
        let { action } = body;

        if (!deviceId) {
            return NextResponse.json({ error: 'Device ID requerido' }, { status: 400, headers: corsHeaders });
        }

        // 1. Fetch current status (re-using GET logic for consistency)
        const now = new Date();
        const dateKey = formatInTimeZone(now, 'America/Lima', 'yyyy-MM-dd');
        
        // Check for duplicates in the last 60 seconds
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const duplicateCheck = await db.select()
            .from(attendance)
            .where(and(
                eq(attendance.deviceId, deviceId),
                gte(attendance.timestamp, oneMinuteAgo)
            ))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        if (duplicateCheck.length > 0) {
            return NextResponse.json({ 
                success: true, 
                message: 'Registro duplicado ignorado (dentro de 60s)',
                record: duplicateCheck[0] 
            }, { status: 200, headers: corsHeaders });
        }

        // Fetch overrides and latest records for state validation
        const overrides = await db.select()
            .from(attendanceOverrides)
            .where(and(
                eq(attendanceOverrides.userId, deviceId),
                eq(attendanceOverrides.dateKey, dateKey)
            ));

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const lastRecords = await db.select()
            .from(attendance)
            .where(and(
                eq(attendance.deviceId, deviceId),
                gte(attendance.timestamp, todayStart)
            ))
            .orderBy(desc(attendance.timestamp))
            .limit(1);

        let isCheckedIn = false;
        let suggestedAction: 'ENTRADA' | 'SALIDA' = 'ENTRADA';

        const limaNow = toZonedTime(now, 'America/Lima');
        const hour = limaNow.getHours();
        const blockType = hour >= 13 ? 'afternoon' : 'morning';
        const ov = overrides.find(o => o.blockType === blockType) || overrides.find(o => o.blockType === (blockType === 'morning' ? 'afternoon' : 'morning'));

        if (ov) {
            if (ov.inTime && !ov.outTime) { isCheckedIn = true; suggestedAction = 'SALIDA'; }
            else { isCheckedIn = false; suggestedAction = 'ENTRADA'; }
        } else if (lastRecords.length > 0) {
            if (lastRecords[0].action === 'ENTRADA') { isCheckedIn = true; suggestedAction = 'SALIDA'; }
            else { isCheckedIn = false; suggestedAction = 'ENTRADA'; }
        }

        // 2. Determine Action
        if (!action) {
            action = suggestedAction;
        }

        // 3. Validate Action
        if (action === 'ENTRADA' && isCheckedIn) {
            return NextResponse.json({ error: 'Ya te encuentras en turno (ENTRADA activa)' }, { status: 409, headers: corsHeaders });
        }
        if (action === 'SALIDA' && !isCheckedIn) {
            return NextResponse.json({ error: 'No tienes una ENTRADA activa para marcar SALIDA' }, { status: 409, headers: corsHeaders });
        }

        // 4. Ensure device exists
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
        const targetTimestamp = timestamp ? new Date(timestamp) : now;

        // 5. Insert Record
        const result = await db.insert(attendance).values({
            userId: deviceId,
            action: action,
            bssid: targetBssid,
            timestamp: targetTimestamp,
            deviceId: deviceId
        }).returning();

        console.log(`[Attendance] ${deviceId} marked ${action} at ${targetTimestamp}`);

        return NextResponse.json({ 
            success: true, 
            record: result[0],
            isCheckedIn: action === 'ENTRADA',
            suggestedAction: action === 'ENTRADA' ? 'SALIDA' : 'ENTRADA'
        }, { status: 201, headers: corsHeaders });
    } catch (error) {
        console.error('Error recording attendance:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500, headers: corsHeaders });
    }
}

