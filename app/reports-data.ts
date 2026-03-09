import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toZonedTime, formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { db } from '@/db';
import { attendance, devices, attendanceOverrides, lateFeeRules, employeeMonthlySummaries, schedules } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

interface RawAttendanceRecord {
  id: number;
  user_id: string; // holds device_id
  display_name: string | null;
  action: 'ENTRADA' | 'SALIDA';
  bssid: string;
  timestamp: Date;
}

interface Session {
  in: string | null;
  out: string | null;
}

interface UserSummary {
  userId: string;
  displayName: string;
  salaryPerBlock: number;
  totalPayment: number;
  days: {
    [dateKey: string]: {
      morning: Session & { status?: string, notes?: string, payment?: number } | null;
      afternoon: Session & { status?: string, notes?: string, payment?: number } | null;
      isLateMorning: boolean;
      isLateAfternoon: boolean;
    };
  };
  schedules: { dayOfWeek: number; blockType: 'morning' | 'afternoon' }[];
}

export interface PayrollEmployeeSummary {
  userId: string;
  displayName: string;
  totalDiscount: number;
  establishedPay: number;
  totalPay: number; // established - discount
  advance: number;
  remaining: number; // totalPay - advance
  regularize: number;
  finalPay: number; // remaining (from prev table) or net + regularize
}

const BASE_BLOCK_PAY = 46.00;

// Seed default rules if empty
async function ensureRules() {
  const rulesCount = await db.select({ count: sql<number>`count(*)` }).from(lateFeeRules);
  if (rulesCount[0].count === 0) {
    const defaultRules = [
      { blockType: 'morning', minMinutes: 10, maxMinutes: 20, feeAmount: '5.00' },
      { blockType: 'morning', minMinutes: 20, maxMinutes: 30, feeAmount: '10.00' },
      { blockType: 'morning', minMinutes: 30, maxMinutes: 60, feeAmount: '13.00' },
      { blockType: 'morning', minMinutes: 60, maxMinutes: null, feeAmount: '23.00' },
      { blockType: 'afternoon', minMinutes: 10, maxMinutes: 20, feeAmount: '5.00' },
      { blockType: 'afternoon', minMinutes: 20, maxMinutes: 30, feeAmount: '10.00' },
      { blockType: 'afternoon', minMinutes: 30, maxMinutes: 60, feeAmount: '13.00' },
      { blockType: 'afternoon', minMinutes: 60, maxMinutes: null, feeAmount: '23.00' },
    ];
    await db.insert(lateFeeRules).values(defaultRules);
  }
}

function getLimaTime(date: Date) {
  const timeZone = 'America/Lima';
  const zonedDate = toZonedTime(date, timeZone);
  
  return {
    hour: zonedDate.getHours(),
    minute: zonedDate.getMinutes()
  };
}

function calculateLateFee(isoString: string | null, blockType: 'morning' | 'afternoon', rules: any[], basePay: number): number {
  if (!isoString) return basePay; // No show = Full discount (0 pay)

  const timestamp = new Date(isoString);
  const lima = getLimaTime(timestamp);
  const h = lima.hour;
  const m = lima.minute;

  // Minutes after start
  const startHour = blockType === 'morning' ? 9 : 15;
  const diffMinutes = (h - startHour) * 60 + m;

  if (diffMinutes < 10) return 0; // On time

  const blockRules = rules.filter(r => r.blockType === blockType);
  for (const rule of blockRules) {
    if (diffMinutes >= rule.minMinutes && (rule.maxMinutes === null || diffMinutes < rule.maxMinutes)) {
      return parseFloat(rule.feeAmount);
    }
  }

  return 0;
}

export async function getMonthlyData(date: Date): Promise<UserSummary[]> {
  await ensureRules();
  
  // Boundaries in Lima timezone
  const start = fromZonedTime(format(startOfMonth(date), 'yyyy-MM-dd 00:00:00'), 'America/Lima');
  const end = fromZonedTime(format(endOfMonth(date), 'yyyy-MM-dd 23:59:59.999'), 'America/Lima');

  try {
    const allDevices = await db.select().from(devices);
    const userMap: { [userId: string]: UserSummary } = {};
    
    allDevices.forEach(dev => {
      if (!dev.displayName || dev.displayName.trim() === '') return;
      userMap[dev.deviceId] = {
        userId: dev.deviceId,
        displayName: dev.displayName,
        salaryPerBlock: parseFloat(dev.salaryPerBlock || '46.00'),
        days: {},
        totalPayment: 0,
        schedules: []
      };
    });

    const allSchedules = await db.select().from(schedules);
    allSchedules.forEach(sch => {
      if (userMap[sch.userId]) {
        userMap[sch.userId].schedules.push({
          dayOfWeek: sch.dayOfWeek,
          blockType: sch.blockType as 'morning' | 'afternoon'
        });
      }
    });

    const attendanceRecords = await db.select({
      id: attendance.id,
      user_id: attendance.userId,
      display_name: devices.displayName,
      action: attendance.action,
      bssid: attendance.bssid,
      timestamp: attendance.timestamp,
      device_id: attendance.deviceId,
    })
    .from(attendance)
    .innerJoin(devices, eq(attendance.deviceId, devices.deviceId))
    .where(and(gte(attendance.timestamp, start), lte(attendance.timestamp, end)))
    .orderBy(attendance.timestamp);

    const overrides = await db.select()
      .from(attendanceOverrides)
      .where(and(
        gte(attendanceOverrides.dateKey, format(start, 'yyyy-MM-dd')),
        lte(attendanceOverrides.dateKey, format(end, 'yyyy-MM-dd'))
      ));

    const rules = await db.select().from(lateFeeRules);

    // 1. Process Logs into userMap
    attendanceRecords.forEach((rec) => {
      const userId = rec.user_id;
      if (!userId) return; // Null check for DB field

      const t = rec.timestamp;
      const dateKey = formatInTimeZone(t, 'America/Lima', 'yyyy-MM-dd');
      const lima = getLimaTime(t);
      const h = lima.hour;
      const m = lima.minute;

      if (!userMap[userId]) return;
      if (!userMap[userId].days[dateKey]) {
        userMap[userId].days[dateKey] = {
          morning: null, afternoon: null, isLateMorning: false, isLateAfternoon: false
        };
      }

      const dayData = userMap[userId].days[dateKey];
      const type: 'morning' | 'afternoon' = h < 14 ? 'morning' : 'afternoon';
      
      if (rec.action === 'ENTRADA') {
        if (!dayData[type]) {
          dayData[type] = { in: t.toISOString(), out: null };
          if (type === 'morning') {
            if (h > 9 || (h === 9 && m > 0)) dayData.isLateMorning = true;
          } else {
            if (h > 15 || (h === 15 && m > 0)) dayData.isLateAfternoon = true;
          }
        }
      } else if (rec.action === 'SALIDA') {
        if (dayData[type]) dayData[type]!.out = t.toISOString();
      }
    });

    // 2. lookup map for overrides
    const overrideMap: Record<string, any> = {};
    overrides.forEach(ov => {
      overrideMap[`${ov.userId}-${ov.dateKey}-${ov.blockType}`] = ov;
    });

    const daysInMonth = Array.from({ length: endOfMonth(date).getDate() }, (_, i) => {
      const d = new Date(startOfMonth(date));
      d.setDate(i + 1);
      return format(d, 'yyyy-MM-dd');
    });

    const now = new Date();
    const todayKey = formatInTimeZone(now, 'America/Lima', 'yyyy-MM-dd');
    const limaNow = getLimaTime(now);

    Object.values(userMap).forEach(user => {
      daysInMonth.forEach(dateKey => {
        const dayDate = new Date(dateKey + 'T12:00:00Z');
        const dayOfWeek = dayDate.getUTCDay();
        
        if (!user.days[dateKey]) {
          user.days[dateKey] = { morning: null, afternoon: null, isLateMorning: false, isLateAfternoon: false };
        }
        const dayData = user.days[dateKey];

        // Process both blocks
        (['morning', 'afternoon'] as const).forEach(type => {
          const ovKey = `${user.userId}-${dateKey}-${type}`;
          const ov = overrideMap[ovKey];
          const isScheduled = user.schedules.some(s => s.dayOfWeek === dayOfWeek && s.blockType === type);

          if (ov) {
            if (!dayData[type]) dayData[type] = { in: null, out: null };
            if (ov.inTime) {
              dayData[type]!.in = ov.inTime.toISOString();
              const l = getLimaTime(ov.inTime);
              const startH = type === 'morning' ? 9 : 15;
              const isLate = l.hour > startH || (l.hour === startH && l.minute > 0);
              if (type === 'morning') dayData.isLateMorning = isLate; else dayData.isLateAfternoon = isLate;
            }
            if (ov.outTime) dayData[type]!.out = ov.outTime.toISOString();
            dayData[type]!.status = ov.status;
            dayData[type]!.notes = ov.notes;
            dayData[type]!.payment = user.salaryPerBlock - parseFloat(ov.paymentAmount || '0');
          } else if (dayData[type]) {
            // Unscheduled or Scheduled attendance
            const fee = calculateLateFee(dayData[type]!.in, type, rules, user.salaryPerBlock);
            dayData[type]!.payment = user.salaryPerBlock - fee;
            if (!isScheduled) dayData[type]!.notes = (dayData[type]!.notes || '') + ' [Extra]';
          } else if (isScheduled) {
            // Missing scheduled block
            const startH = type === 'morning' ? 9 : 15;
            const isPast = dateKey < todayKey || (dateKey === todayKey && limaNow.hour >= startH + 1);
            if (isPast) {
              dayData[type] = { in: null, out: null, status: 'Inasistencia', payment: 0 };
            }
          }
        });
      });
    });

    // Final total calculation
    Object.values(userMap).forEach(user => {
      user.totalPayment = Object.values(user.days).reduce((acc, d) => 
        acc + (d.morning?.payment || 0) + (d.afternoon?.payment || 0), 0);
    });

    return Object.values(userMap);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }
}

export async function getPayrollSummary(date: Date): Promise<PayrollEmployeeSummary[]> {
  const monthKey = formatInTimeZone(date, 'America/Lima', 'yyyy-MM');
  
  // Reuse monthly data calculation to get discounts and worked blocks
  const monthlyData = await getMonthlyData(date);
  
  // Fetch advances and regularizations
  const sums = await db.select()
    .from(employeeMonthlySummaries)
    .where(eq(employeeMonthlySummaries.monthKey, monthKey));

  return monthlyData.map(user => {
    let establishedPay = 0;
    let totalDiscount = 0;

    Object.values(user.days).forEach(day => {
      if (day.morning) establishedPay += user.salaryPerBlock;
      if (day.afternoon) establishedPay += user.salaryPerBlock;
      
      if (day.morning?.payment !== undefined) {
        totalDiscount += (user.salaryPerBlock - day.morning.payment);
      }
      if (day.afternoon?.payment !== undefined) {
        totalDiscount += (user.salaryPerBlock - day.afternoon.payment);
      }
    });

    const summary = sums.find(s => s.userId === user.userId) || {
      advanceAmount: '0.00',
      regularizeAmount: '0.00'
    };

    const totalPay = establishedPay - totalDiscount;
    const advance = parseFloat(summary.advanceAmount || '0');
    const remaining = totalPay - advance;
    const regularize = parseFloat(summary.regularizeAmount || '0');
    const finalPay = totalPay + regularize; // As per mockup: Pago mes + regularizar

    return {
      userId: user.userId,
      displayName: user.displayName,
      totalDiscount,
      establishedPay,
      totalPay,
      advance,
      remaining,
      regularize,
      finalPay
    };
  });
}

