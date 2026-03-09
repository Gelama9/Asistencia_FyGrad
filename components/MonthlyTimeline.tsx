'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWeekend,
  getDay,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';

import StatusModal from './StatusModal';
import LateFeeConfigModal from './LateFeeConfigModal';
import { Settings } from 'lucide-react';

interface Session {
  in: string | null;
  out: string | null;
  status?: string;
  notes?: string;
  payment?: number;
}

interface UserSummary {
  userId: string;
  displayName: string;
  totalPayment: number;
  days: {
    [dateKey: string]: {
      morning: Session | null;
      afternoon: Session | null;
      isLateMorning: boolean;
      isLateAfternoon: boolean;
    };
  };
  schedules: { dayOfWeek: number; blockType: string }[];
}

interface MonthlyTimelineProps {
  initialRecords: UserSummary[];
  currentDate: Date;
}

export default function MonthlyTimeline({ initialRecords, currentDate: initialDate }: MonthlyTimelineProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const viewDate = initialDate; // Use prop from server as source of truth
  
  const [hoveredCell, setHoveredCell] = useState<{ userId: string, dateKey: string, type: 'morning' | 'afternoon' } | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ 
    userId: string, 
    userName: string, 
    dateKey: string, 
    type: 'morning' | 'afternoon',
    initialStatus?: string,
    initialNotes?: string,
    initialDiscount?: number,
    initialIn?: string | null,
    initialOut?: string | null
  } | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '---';
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Lima'
    }).format(new Date(isoString));
  };

  const navigateMonth = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/reports/monthly?date=${dateStr}`);
  };

  const nextMonth = () => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    navigateMonth(next);
  };
  const prevMonth = () => {
    const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    navigateMonth(prev);
  };
  const goToday = () => {
    router.push('/reports/monthly');
  };

  const getStatusColor = (session: Session | null, isLate: boolean) => {
    if (!session) return 'bg-slate-100/50 border-dashed border-slate-200';
    
    if (session.status) {
      if (session.status === 'Puntual') return 'bg-emerald-100 border-emerald-200';
      if (session.status === 'Tardanza') return 'bg-rose-100 border-rose-200';
      if (session.status === 'Permiso') return 'bg-rose-100 border-rose-200 ring-2 ring-rose-400/20';
      return 'bg-slate-200 border-slate-300';
    }

    return isLate ? 'bg-rose-100 border-rose-200' : 'bg-emerald-100 border-emerald-200';
  };

  const isBlockScheduled = (userSchedules: { dayOfWeek: number; blockType: string }[], day: Date, blockType: string) => {
    const dayOfWeek = getDay(day);
    return userSchedules.some(s => s.dayOfWeek === dayOfWeek && s.blockType === blockType);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 ring-1 ring-slate-900/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {format(viewDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Línea de Tiempo Mensual</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl ring-1 ring-slate-200">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600 hover:text-slate-900"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={goToday}
              className="px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-600 hover:text-slate-900"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <button
            onClick={() => setIsConfigOpen(true)}
            className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg hover:scale-105 transition-transform"
            title="Configurar Tardanzas"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Timeline Grid Wrapper */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="sticky left-0 z-40 bg-slate-50 p-6 text-left min-w-[240px] border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</span>
                </th>
                {daysInMonth.map((day) => {
                  const isDayWeekend = isWeekend(day);
                  const dateKey = format(day, 'yyyy-MM-dd');
                  return (
                    <th key={dateKey} className={`p-2 min-w-[80px] border-r border-slate-100 last:border-r-0 ${isDayWeekend ? 'bg-slate-100/30' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${isDayWeekend ? 'text-slate-400' : 'text-slate-500'}`}>
                          {format(day, 'EEE', { locale: es })}
                        </span>
                        <span className={`text-sm font-black ${isDayWeekend ? 'text-slate-400' : 'text-slate-900'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </th>
                  );
                })}
                <th className="p-6 text-right min-w-[140px] bg-slate-50 border-l border-slate-100">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Total a Pagar (S/.)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialRecords.map((user) => (
                <tr key={user.userId} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="sticky left-0 z-10 bg-white p-4 border-r border-slate-100 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-md shrink-0">
                        {user.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-800 truncate leading-tight">{user.displayName}</p>
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Activo</p>
                      </div>
                    </div>
                  </td>
                  {daysInMonth.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayData = user.days[dateKey];
                    const isDayWeekend = isWeekend(day);

                    return (
                      <td key={dateKey} className={`p-2 border-r border-slate-100 last:border-r-0 ${isDayWeekend ? 'bg-slate-50/20' : ''}`}>
                        <div className="flex gap-1 h-10">
                          {/* Morning Block */}
                          <div 
                            onMouseEnter={() => setHoveredCell({ userId: user.userId, dateKey, type: 'morning' })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => setSelectedCell({
                              userId: user.userId,
                              userName: user.displayName,
                              dateKey,
                              type: 'morning',
                              initialStatus: dayData?.morning?.status,
                              initialNotes: dayData?.morning?.notes,
                              initialDiscount: 46 - (dayData?.morning?.payment ?? 46),
                              initialIn: dayData?.morning?.in,
                              initialOut: dayData?.morning?.out
                            })}
                            className={`flex-1 rounded-lg transition-all cursor-pointer relative group/cell border
                              ${getStatusColor(dayData?.morning || null, dayData?.isLateMorning || false)}
                              ${isBlockScheduled(user.schedules, day, 'morning') ? 'border-slate-400 border-2' : ''}
                            `}
                          >
                            {hoveredCell?.userId === user.userId && hoveredCell?.dateKey === dateKey && hoveredCell?.type === 'morning' && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-[10px] font-bold whitespace-nowrap ring-4 ring-white">
                                  <p className="text-slate-400 uppercase tracking-widest mb-1">Entrada Mañana</p>
                                  <p className="text-sm">{dayData?.morning?.in ? formatTime(dayData.morning.in) : 'Sin registro'}</p>
                                  {dayData?.morning?.payment !== undefined && (
                                    <p className="mt-1 text-emerald-400 font-black">Cobro: S/. {dayData.morning.payment.toFixed(2)}</p>
                                  )}
                                  {dayData?.morning?.payment !== undefined && dayData.morning.payment < 46 && (
                                    <p className="text-rose-400 font-bold">Desc: S/. {(46 - dayData.morning.payment).toFixed(2)}</p>
                                  )}
                                  {dayData?.morning?.notes && (
                                    <p className="mt-2 text-slate-300 border-t border-slate-700 pt-2 italic">"{dayData.morning.notes.substring(0, 30)}..."</p>
                                  )}
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                              </div>
                            )}
                            {dayData?.morning?.status === 'Permiso' && (
                              <div className="absolute inset-0 flex items-center justify-center text-amber-600 opacity-40">
                                <Info size={12} />
                              </div>
                            )}
                          </div>

                          {/* Afternoon Block */}
                          <div 
                            onMouseEnter={() => setHoveredCell({ userId: user.userId, dateKey, type: 'afternoon' })}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => setSelectedCell({
                              userId: user.userId,
                              userName: user.displayName,
                              dateKey,
                              type: 'afternoon',
                              initialStatus: dayData?.afternoon?.status,
                              initialNotes: dayData?.afternoon?.notes,
                              initialDiscount: 46 - (dayData?.afternoon?.payment ?? 46),
                              initialIn: dayData?.afternoon?.in,
                              initialOut: dayData?.afternoon?.out
                            })}
                            className={`flex-1 rounded-lg transition-all cursor-pointer relative group/cell border
                              ${getStatusColor(dayData?.afternoon || null, dayData?.isLateAfternoon || false)}
                              ${isBlockScheduled(user.schedules, day, 'afternoon') ? 'border-slate-400 border-2' : ''}
                            `}
                          >
                            {hoveredCell?.userId === user.userId && hoveredCell?.dateKey === dateKey && hoveredCell?.type === 'afternoon' && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                                <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl text-[10px] font-bold whitespace-nowrap ring-4 ring-white">
                                  <p className="text-slate-400 uppercase tracking-widest mb-1">Entrada Tarde</p>
                                  <p className="text-sm">{dayData?.afternoon?.in ? formatTime(dayData.afternoon.in) : 'Sin registro'}</p>
                                  {dayData?.afternoon?.payment !== undefined && (
                                    <p className="mt-1 text-emerald-400 font-black">Cobro: S/. {dayData.afternoon.payment.toFixed(2)}</p>
                                  )}
                                  {dayData?.afternoon?.payment !== undefined && dayData.afternoon.payment < 46 && (
                                    <p className="text-rose-400 font-bold">Desc: S/. {(46 - dayData.afternoon.payment).toFixed(2)}</p>
                                  )}
                                  {dayData?.afternoon?.notes && (
                                    <p className="mt-2 text-slate-300 border-t border-slate-700 pt-2 italic">"{dayData.afternoon.notes.substring(0, 30)}..."</p>
                                  )}
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                              </div>
                            )}
                            {dayData?.afternoon?.status === 'Permiso' && (
                              <div className="absolute inset-0 flex items-center justify-center text-amber-600 opacity-40">
                                <Info size={12} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-4 text-right bg-slate-50/50 border-l border-slate-100">
                    <p className="text-sm font-black text-slate-800">S/. {user.totalPayment.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Neto Mensual</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-200"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Puntual</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tardanza</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-rose-100 border border-rose-200 ring-2 ring-rose-400/20"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permiso/Especial</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-slate-100/50 border border-dashed border-slate-200"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sin Registro</span>
          </div>
          <div className="hidden md:flex items-center gap-3 ml-auto text-slate-400 italic">
            <Info size={14} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Haz click en un bloque para editar</span>
          </div>
        </div>
      </div>

      {selectedCell && (
        <StatusModal
          isOpen={!!selectedCell}
          onClose={() => setSelectedCell(null)}
          userId={selectedCell.userId}
          userName={selectedCell.userName}
          dateKey={selectedCell.dateKey}
          blockType={selectedCell.type}
          initialStatus={selectedCell.initialStatus}
          initialNotes={selectedCell.initialNotes}
          initialPayment={selectedCell.initialDiscount}
          initialIn={selectedCell.initialIn}
          initialOut={selectedCell.initialOut}
        />
      )}

      <LateFeeConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
