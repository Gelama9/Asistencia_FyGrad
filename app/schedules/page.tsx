import { getSchedules } from '@/app/schedules-actions';
import { db } from '@/db';
import { devices } from '@/db/schema';
import SchedulesClient from '@/components/SchedulesClient';

export default async function SchedulesPage() {
  const allSchedules = await getSchedules();
  const allDevices = await db.select().from(devices);

  return (
    <main className="w-full">
      <SchedulesClient initialSchedules={allSchedules} devices={allDevices} />
    </main>
  );
}
