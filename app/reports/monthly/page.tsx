import MonthlyTimeline from '@/components/MonthlyTimeline';
import { getMonthlyData } from '@/app/reports-data';

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const now = params.date ? new Date(`${params.date}T00:00:00`) : new Date();
  const initialRecords = await getMonthlyData(now);

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 uppercase">REPORTE MENSUAL</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Control de Asistencia Detallado</p>
        </div>

      </header>

      <main className="w-full">
        <MonthlyTimeline initialRecords={initialRecords} currentDate={now} />
      </main>

      <footer className="pt-10 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Fygrad Reporting Suite • Línea de Tiempo v1.0</p>
      </footer>
    </div>
  );
}
