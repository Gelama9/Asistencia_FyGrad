import { format, startOfMonth, endOfMonth } from 'date-fns';
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

// Helper to get Lima Time
function getLimaTime(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach(p => map[p.type] = p.value);
  return {
    hour: parseInt(map.hour || '0'),
    minute: parseInt(map.minute || '0')
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
  
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  try {
    // 1. Fetch ALL registered devices (collaborators)
    const allDevices = await db.select().from(devices);
    const userMap: { [userId: string]: UserSummary } = {};
    
    // Initialize userMap with all devices
    allDevices.forEach(dev => {
      userMap[dev.deviceId] = {
        userId: dev.deviceId,
        displayName: dev.displayName || 'Desconocido',
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
      salary_per_block: devices.salaryPerBlock,
    })
    .from(attendance)
    .leftJoin(devices, eq(attendance.deviceId, devices.deviceId))
    .where(and(
      gte(attendance.timestamp, start),
      lte(attendance.timestamp, end)
    ))
    .orderBy(attendance.timestamp);

    const rawRecords = attendanceRecords as any[];

    const overrides = await db.select()
      .from(attendanceOverrides)
      .where(and(
        gte(attendanceOverrides.dateKey, format(start, 'yyyy-MM-dd')),
        lte(attendanceOverrides.dateKey, format(end, 'yyyy-MM-dd'))
      ));

    rawRecords.forEach((rec) => {
      const userId = rec.user_id;
      const displayName = rec.display_name || 'Desconocido';
      const timestamp = new Date(rec.timestamp);
      
      const dateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(timestamp);

      if (!userMap[userId]) {
        // Fallback for any userId that might exist in attendance but not in devices (shouldn't happen given the join above, but stay safe)
        userMap[userId] = { 
          userId, 
          displayName, 
          salaryPerBlock: parseFloat(rec.salary_per_block || '46.00'),
          days: {}, 
          totalPayment: 0,
          schedules: []
        };
      }

      if (!userMap[userId].days[dateKey]) {
        userMap[userId].days[dateKey] = {
          morning: null,
          afternoon: null,
          isLateMorning: false,
          isLateAfternoon: false
        };
      }

      const dayData = userMap[userId].days[dateKey];
      const lima = getLimaTime(timestamp);
      const h = lima.hour;
      const m = lima.minute;

      if (rec.action === 'ENTRADA') {
        if (h < 13) {
          if (!dayData.morning) {
            dayData.morning = { in: timestamp.toISOString(), out: null };
            if (h > 9 || (h === 9 && m > 0)) dayData.isLateMorning = true;
          }
        } else {
          if (!dayData.afternoon) {
            dayData.afternoon = { in: timestamp.toISOString(), out: null };
            if (h > 15 || (h === 15 && m > 0)) dayData.isLateAfternoon = true;
          }
        }
      } else if (rec.action === 'SALIDA') {
        if (h < 13) {
          if (dayData.morning) dayData.morning.out = timestamp.toISOString();
        } else {
          if (dayData.afternoon) dayData.afternoon.out = timestamp.toISOString();
        }
      }
    });

    // Apply Overrides and Auto-Calculated Fees
    overrides.forEach(ov => {
      if (!userMap[ov.userId]) {
        // We might not have attendance for this user, so we need to fetch their info
        userMap[ov.userId] = { 
          userId: ov.userId, 
          displayName: 'Desconocido', 
          salaryPerBlock: 46.00, // Default if not found in loop above
          days: {}, 
          totalPayment: 0,
          schedules: []
        };
      }
      if (!userMap[ov.userId].days[ov.dateKey]) {
        userMap[ov.userId].days[ov.dateKey] = {
          morning: null,
          afternoon: null,
          isLateMorning: false,
          isLateAfternoon: false
        };
      }
    });

    const rules = await db.select().from(lateFeeRules);

    // 2. Create a lookup map for overrides
    const overrideMap: Record<string, any> = {};
    overrides.forEach(ov => {
      const key = `${ov.userId}-${ov.dateKey}-${ov.blockType}`;
      overrideMap[key] = ov;
    });

    // 3. Process each day for each user
    const daysInMonth = Array.from({ length: end.getDate() }, (_, i) => {
      const d = new Date(start);
      d.setDate(i + 1);
      return format(d, 'yyyy-MM-dd');
    });

    const now = new Date();
    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
    const limaNow = getLimaTime(now);

    Object.values(userMap).forEach(user => {
      daysInMonth.forEach(dateKey => {
        const dayDate = new Date(dateKey + 'T12:00:00Z');
        const dayOfWeek = dayDate.getUTCDay(); // 0-6

        // Check if user is scheduled for this day
        const daySchedules = user.schedules.filter(s => s.dayOfWeek === dayOfWeek);
        
        daySchedules.forEach(sched => {
          const type = sched.blockType;
          const key = `${user.userId}-${dateKey}-${type}`;
          const ov = overrideMap[key];
          
          if (!user.days[dateKey]) {
            user.days[dateKey] = {
              morning: null,
              afternoon: null,
              isLateMorning: false,
              isLateAfternoon: false
            };
          }
          const dayData = user.days[dateKey];

          if (ov) {
            if (!dayData[type]) dayData[type] = { in: null, out: null };
            dayData[type]!.status = ov.status;
            dayData[type]!.notes = ov.notes;
            dayData[type]!.payment = user.salaryPerBlock - parseFloat(ov.paymentAmount || '0');
          } else if (dayData[type]) {
            // Already has attendance, calculate fee
            const fee = calculateLateFee(dayData[type]!.in, type, rules, user.salaryPerBlock);
            dayData[type]!.payment = user.salaryPerBlock - fee;
          } else {
            // Missing scheduled block
            // Only mark as Inasistencia if the date is in the past OR today and the block start time has passed
            let isPast = dateKey < todayKey;
            let isTodayPassed = false;
            
            if (dateKey === todayKey) {
              const startHour = type === 'morning' ? 9 : 15;
              if (limaNow.hour >= startHour + 1) { // Wait 1 hour after start to mark as absence if no show
                isTodayPassed = true;
              }
            }

            if (isPast || isTodayPassed) {
              dayData[type] = { in: null, out: null, status: 'Inasistencia', payment: 0 };
            }
          }
        });
      });
    });

    // Calculate total payments per user
    Object.values(userMap).forEach(user => {
      let total = 0;
      Object.values(user.days).forEach(day => {
        if (day.morning?.payment !== undefined) total += day.morning.payment;
        if (day.afternoon?.payment !== undefined) total += day.afternoon.payment;
      });
      user.totalPayment = total;
    });

    return Object.values(userMap);
  } catch (error) {
    console.error('Error fetching monthly data:', error);
    return [];
  }
}

export async function getPayrollSummary(date: Date): Promise<PayrollEmployeeSummary[]> {
  const monthKey = format(date, 'yyyy-MM');
  
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

