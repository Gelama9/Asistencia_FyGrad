'use client';

import { useState } from 'react';
import { toggleSchedule } from '@/app/schedules-actions';
import { Calendar, Clock, User, CheckCircle2, Circle } from 'lucide-react';

interface Schedule {
  userId: string;
  dayOfWeek: number;
  blockType: string;
}

interface Device {
  deviceId: string;
  displayName: string | null;
}

export default function SchedulesClient({ initialSchedules, devices }: { initialSchedules: Schedule[], devices: Device[] }) {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [loading, setLoading] = useState<string | null>(null);

  const days = [
    { id: 1, name: 'Lunes' },
    { id: 2, name: 'Martes' },
    { id: 3, name: 'Miércoles' },
    { id: 4, name: 'Jueves' },
    { id: 5, name: 'Viernes' },
    { id: 6, name: 'Sábado' },
    { id: 0, name: 'Domingo' },
  ];

  const handleToggle = async (userId: string, dayOfWeek: number, blockType: 'morning' | 'afternoon') => {
    const loadingKey = `${userId}-${dayOfWeek}-${blockType}`;
    setLoading(loadingKey);
    
    const result = await toggleSchedule(userId, dayOfWeek, blockType);
    
    if (result.success) {
      setSchedules(prev => {
        const exists = prev.find(s => s.userId === userId && s.dayOfWeek === dayOfWeek && s.blockType === blockType);
        if (exists) {
          return prev.filter(s => !(s.userId === userId && s.dayOfWeek === dayOfWeek && s.blockType === blockType));
        } else {
          return [...prev, { userId, dayOfWeek, blockType }];
        }
      });
    }
    
    setLoading(null);
  };

  const isScheduled = (userId: string, dayOfWeek: number, blockType: string) => {
    return schedules.some(s => s.userId === userId && s.dayOfWeek === dayOfWeek && s.blockType === blockType);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 uppercase">GESTIÓN DE HORARIOS</h1>
          <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Configuración de Bloques Semanales</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {devices.map((device) => (
          <div key={device.deviceId} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 overflow-hidden transform hover:scale-[1.005] transition-all duration-300">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{device.displayName || 'Sin nombre'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{device.deviceId}</p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4">
                {days.map((day) => (
                  <div key={day.id} className="flex-1 min-w-[140px] space-y-3">
                    <div className="text-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{day.name}</span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Morning Block */}
                      <button
                        disabled={loading === `${device.deviceId}-${day.id}-morning`}
                        onClick={() => handleToggle(device.deviceId, day.id, 'morning')}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden
                          ${isScheduled(device.deviceId, day.id, 'morning')
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                          }
                          ${loading === `${device.deviceId}-${day.id}-morning` ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <Clock size={16} className={isScheduled(device.deviceId, day.id, 'morning') ? 'text-emerald-400' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Mañana</span>
                        {isScheduled(device.deviceId, day.id, 'morning') ? (
                          <CheckCircle2 size={14} className="absolute top-2 right-2 text-emerald-400" />
                        ) : (
                          <Circle size={14} className="absolute top-2 right-2 opacity-10 group-hover:opacity-100" />
                        )}
                      </button>

                      {/* Afternoon Block */}
                      <button
                        disabled={loading === `${device.deviceId}-${day.id}-afternoon`}
                        onClick={() => handleToggle(device.deviceId, day.id, 'afternoon')}
                        className={`w-full p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group relative overflow-hidden
                          ${isScheduled(device.deviceId, day.id, 'afternoon')
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                          }
                          ${loading === `${device.deviceId}-${day.id}-afternoon` ? 'opacity-50 cursor-wait' : ''}
                        `}
                      >
                        <Clock size={16} className={isScheduled(device.deviceId, day.id, 'afternoon') ? 'text-emerald-400' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">Tarde</span>
                        {isScheduled(device.deviceId, day.id, 'afternoon') ? (
                          <CheckCircle2 size={14} className="absolute top-2 right-2 text-emerald-400" />
                        ) : (
                          <Circle size={14} className="absolute top-2 right-2 opacity-10 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="pt-10 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Fygrad Scheduling System • v1.0</p>
      </footer>
    </div>
  );
}
