import AttendanceReport from '@/components/AttendanceReport';
import { db } from '@/db';
import { attendance, devices as devicesTable } from '@/db/schema';
import { formatInTimeZone } from 'date-fns-tz';
import { desc, eq } from 'drizzle-orm';

interface RawAttendanceRecord {
  id: number;
  user_id: string; // holds device_id
  display_name: string | null;
  action: 'ENTRADA' | 'SALIDA';
  bssid: string;
  timestamp: Date;
}

interface Device {
  device_id: string;
  display_name: string;
}

interface UserDaySummary {
  userId: string;
  displayName: string;
  sessions: { in: string | null; out: string | null }[];
  totalMs: number;
  isLateMorning: boolean;
  isLateAfternoon: boolean;
}

interface DayGroup {
  dateLabel: string;
  dateKey: string;
  isWeekend: boolean;
  users: UserDaySummary[];
}

// Helper to get Lima Time components
function getLimaInfo(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach(p => map[p.type] = p.value);

  return {
    year: parseInt(map.year),
    month: parseInt(map.month),
    day: parseInt(map.day),
    hour: parseInt(map.hour),
    minute: parseInt(map.minute),
    dateKey: formatInTimeZone(date, 'America/Lima', 'yyyy-MM-dd')
  };
}

async function getData(): Promise<{ dayGroups: DayGroup[]; devices: Device[] }> {
  try {
    const devicesData = await db.select({
      device_id: devicesTable.deviceId,
      display_name: devicesTable.displayName,
    })
    .from(devicesTable)
    .orderBy(desc(devicesTable.createdAt));

    const recordsData = await db.select({
      id: attendance.id,
      user_id: attendance.userId,
      display_name: devicesTable.displayName,
      action: attendance.action,
      bssid: attendance.bssid,
      timestamp: attendance.timestamp,
    })
    .from(attendance)
    .innerJoin(devicesTable, eq(attendance.deviceId, devicesTable.deviceId))
    .orderBy(desc(attendance.timestamp))
    .limit(2000);

    const devices = devicesData as Device[];
    const records = recordsData as unknown as RawAttendanceRecord[];

    const groups: { [key: string]: { [userId: string]: RawAttendanceRecord[] } } = {};

    records.forEach((rec) => {
      const lima = getLimaInfo(new Date(rec.timestamp));
      const dateKey = lima.dateKey;
      if (!groups[dateKey]) groups[dateKey] = {};
      if (!groups[dateKey][rec.user_id]) groups[dateKey][rec.user_id] = [];
      groups[dateKey][rec.user_id].push(rec);
    });

    const dayGroups: DayGroup[] = Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        const dateLabel = new Intl.DateTimeFormat('es-PE', {
          weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
          timeZone: 'America/Lima'
        }).format(dateObj);

        const usersInDay = Object.keys(groups[dateKey]).map((userId) => {
          const userRecs = groups[dateKey][userId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          const displayName = userRecs[0].display_name!; // Now guaranteed by innerJoin and non-null filter if applied

          const sessions: { in: string | null; out: string | null }[] = [];
          let current: { in: string | null; out: string | null } | null = null;

          userRecs.forEach(r => {
            const tsString = new Date(r.timestamp).toISOString();
            if (r.action === 'ENTRADA') {
              if (current) {
                // Close any unclosed session before opening a new one
                sessions.push(current);
              }
              current = { in: tsString, out: null };
            } else if (r.action === 'SALIDA') {
              if (current) {
                // Normal flow: clock out completes the session
                current.out = tsString;
                sessions.push(current);
                current = null;
              } else {
                // Orphaned clock out: User forgot to clock in
                sessions.push({ in: null, out: tsString });
              }
            }
          });
          if (current) sessions.push(current);

          let isLateMorning = false;
          let isLateAfternoon = false;
          let totalMs = 0;

          sessions.forEach(s => {
            // Check tardiness based on ENTRADA (if present)
            if (s.in) {
              const lima = getLimaInfo(new Date(s.in));
              const h = lima.hour;
              const m = lima.minute;
              // Morning: Late if after 9:00 AM and before 1:00 PM (13:00)
              if (h < 13 && (h > 9 || (h === 9 && m > 0))) isLateMorning = true;
              // Afternoon: Late if after 3:00 PM (15:00)
              if (h >= 13 && (h > 15 || (h === 15 && m > 0))) isLateAfternoon = true;
            }

            // Only sum duration if both bounds exist
            if (s.in && s.out) {
              totalMs += (new Date(s.out).getTime() - new Date(s.in).getTime());
            }
          });

          return { userId, displayName, sessions, totalMs, isLateMorning, isLateAfternoon };
        });

        return { dateKey, dateLabel, isWeekend, users: usersInDay };
      });

    return { dayGroups, devices };
  } catch (error) {
    console.error(error);
    return { dayGroups: [], devices: [] };
  }
}

export default async function Home() {
  const { dayGroups, devices } = await getData();

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 uppercase">REPORTE DIARIO</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Visualización de Asistencia Fygrad</p>
        </div>

        <div className="bg-white p-4 rounded-3xl ring-1 ring-slate-900/5 shadow-lg shadow-slate-200/40 flex items-center gap-4 transition-all hover:shadow-xl hover:shadow-slate-200/50">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-xs font-black shadow-inner">
            {devices.length}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Personal</p>
            <p className="text-sm font-black text-slate-900 tracking-tight leading-none">Equipos Activos</p>
          </div>
        </div>
      </header>

      <main className="w-full">
        <AttendanceReport dayGroups={dayGroups} />
      </main>

      <footer className="pt-10 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Fygrad Reporting Suite • Version 3.0</p>
      </footer>
    </div>
  );
}

