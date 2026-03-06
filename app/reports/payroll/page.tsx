import { format, startOfMonth } from 'date-fns';
import { getPayrollSummary } from '@/app/reports-data';
import PayrollSummaryTable from '@/components/PayrollSummaryTable';
import { es } from 'date-fns/locale';
import { DollarSign, FileText } from 'lucide-react';

export default async function PayrollReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const currentDate = params.date ? new Date(params.date) : new Date();
  const summaryData = await getPayrollSummary(currentDate);
  const monthKey = format(currentDate, 'yyyy-MM');

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-12 space-y-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6 animate-in slide-in-from-left duration-500">
          <div className="h-16 w-16 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 ring-4 ring-white">
            <DollarSign size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
              Planilla de Pagos
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
              <FileText size={14} />
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-700 delay-150">
        <PayrollSummaryTable data={summaryData} monthKey={monthKey} />
      </div>

      {/* Footer Branding */}
      <div className="max-w-7xl mx-auto pt-12 border-t border-slate-200 flex justify-between items-center opacity-30">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll System v2.0</p>
        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
}
