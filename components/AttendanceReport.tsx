'use client';

import { useMemo, useState } from 'react';

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

interface AttendanceReportProps {
    dayGroups: DayGroup[];
}

// Client-side helper to format time consistently in Lima Timezone
function formatLimaTime(isoString: string | null) {
    if (!isoString) return '---';
    return new Intl.DateTimeFormat('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Lima'
    }).format(new Date(isoString));
}

export default function AttendanceReport({ dayGroups }: AttendanceReportProps) {
    const [selectedDateIndex, setSelectedDateIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const currentGroup = useMemo(() => {
        if (dayGroups.length === 0) return null;
        return dayGroups[selectedDateIndex];
    }, [dayGroups, selectedDateIndex]);

    const filteredUsers = useMemo(() => {
        if (!currentGroup) return [];
        if (!searchTerm.trim()) return currentGroup.users;

        const term = searchTerm.toLowerCase();
        return currentGroup.users.filter(user =>
            user.displayName.toLowerCase().includes(term)
        );
    }, [currentGroup, searchTerm]);

    const goToPreviousDay = () => {
        if (selectedDateIndex < dayGroups.length - 1) {
            setSelectedDateIndex(selectedDateIndex + 1);
        }
    };

    const goToNextDay = () => {
        if (selectedDateIndex > 0) {
            setSelectedDateIndex(selectedDateIndex - 1);
        }
    };

    const exportToCSV = () => {
        if (!currentGroup) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Colaborador,ID,Entrada AM,Almuerzo,Regreso PM,Salida,Estado,Tiempo Total (Horas)\n";

        filteredUsers.forEach(user => {
            const morning = user.sessions.find(s => {
                const t = s.in || s.out;
                return t && getLimaHour(t) < 13;
            }) || { in: null, out: null };

            const afternoon = user.sessions.find(s => {
                const t = s.in || s.out;
                return t && getLimaHour(t) >= 13;
            }) || { in: null, out: null };

            const inMorning = morning.in ? new Date(morning.in).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false }) : 'N/A';
            const outMorning = morning.out ? new Date(morning.out).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false }) : 'N/A';
            const inAfternoon = afternoon.in ? new Date(afternoon.in).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false }) : 'N/A';
            const outAfternoon = afternoon.out ? new Date(afternoon.out).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false }) : 'N/A';

            const status = (user.isLateMorning || user.isLateAfternoon) ? 'Tardanza' : 'Puntual';
            const totalHours = (user.totalMs / 3600000).toFixed(2);

            const row = [
                `"${user.displayName}"`,
                `"${user.userId}"`,
                `"${inMorning}"`,
                `"${outMorning}"`,
                `"${inAfternoon}"`,
                `"${outAfternoon}"`,
                `"${status}"`,
                `"${totalHours}"`
            ].join(",");

            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Asistencia_${currentGroup.dateKey}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (dayGroups.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-24 text-center ring-1 ring-slate-900/5 shadow-2xl shadow-slate-200/40">
                <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Sin registros de asistencia</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Admin Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                {/* Date Navigator */}
                <div className="bg-white rounded-3xl p-2 ring-1 ring-slate-900/5 shadow-md shadow-slate-200/40 flex items-center gap-2 flex-1 md:flex-none">
                    <button
                        onClick={goToPreviousDay}
                        disabled={selectedDateIndex === dayGroups.length - 1}
                        className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-400 hover:text-slate-900"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="px-4 text-center min-w-[200px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Asistencia del Día</p>
                        <p className="text-sm font-black text-slate-900">{currentGroup?.dateLabel}</p>
                    </div>

                    <button
                        onClick={goToNextDay}
                        disabled={selectedDateIndex === 0}
                        className="h-10 w-10 rounded-2xl flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-400 hover:text-slate-900"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Search Bar & Export */}
                <div className="flex gap-4 flex-1">
                    <div className="bg-white rounded-3xl p-2 px-6 ring-1 ring-slate-900/5 shadow-md shadow-slate-200/40 flex items-center gap-4 flex-1">
                        <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-[9px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-widest">Borrar</button>
                        )}
                    </div>

                    <button
                        onClick={exportToCSV}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-3xl px-6 flex items-center gap-2 ring-1 ring-slate-900/10 shadow-lg shadow-slate-300/50 transition-all hover:shadow-xl hover:-translate-y-0.5"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="text-xs font-black uppercase tracking-widest hidden md:block">Exportar CSV</span>
                    </button>
                </div>
            </div>

            {/* Main Report Table */}
            <div className="bg-white rounded-[3rem] ring-1 ring-slate-900/5 shadow-2xl shadow-slate-200/40 overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="p-20 text-center">
                        <p className="text-slate-300 font-black tracking-widest uppercase text-[10px]">No se encontró personal bajo este filtro</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredUsers.map((user) => {
                            const morning = user.sessions.find(s => {
                                const t = s.in || s.out;
                                return t && getLimaHour(t) < 13;
                            }) || { in: null, out: null };

                            const afternoon = user.sessions.find(s => {
                                const t = s.in || s.out;
                                return t && getLimaHour(t) >= 13;
                            }) || { in: null, out: null };

                            return (
                                <div key={user.userId} className="group p-6 md:p-8 flex flex-col md:grid md:grid-cols-6 items-center gap-6 md:gap-8 hover:bg-slate-50/50 transition-colors relative">
                                    {/* User Info */}
                                    <div className="col-span-1 flex items-center w-full">
                                        <div className="h-14 w-14 md:h-12 md:w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-sm md:text-xs font-black mr-4 ring-4 ring-white shadow-lg shadow-slate-200/50 shrink-0">
                                            {user.displayName.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-base md:text-sm font-black text-slate-800 truncate leading-tight">{user.displayName}</p>
                                            <p className="text-[10px] md:text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Colaborador</p>
                                        </div>
                                    </div>

                                    {/* Time Slots Grid for Mobile / Columns for Desktop */}
                                    <div className="col-span-3 w-full grid grid-cols-2 md:contents gap-4">
                                        <div className="md:col-span-1 text-center bg-slate-50 md:bg-slate-50/50 py-4 md:py-3 rounded-2xl border border-slate-100/50">
                                            <p className="text-[9px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Entrada AM</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className={`text-sm md:text-[13px] font-black ${user.isLateMorning ? 'text-rose-500' : 'text-slate-900'}`}>{formatLimaTime(morning.in)}</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1 text-center bg-slate-50 md:bg-slate-50/50 py-4 md:py-3 rounded-2xl border border-slate-100/50">
                                            <p className="text-[9px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Almuerzo</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className="text-sm md:text-[13px] font-black text-slate-900">{formatLimaTime(morning.out)}</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-1 text-center bg-slate-50 md:bg-slate-50/50 py-4 md:py-3 rounded-2xl border border-slate-100/50 col-span-2 md:col-span-1">
                                            <p className="text-[9px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Regreso PM</p>
                                            <div className="flex justify-center items-baseline gap-1">
                                                <span className={`text-sm md:text-[13px] font-black ${user.isLateAfternoon ? 'text-rose-500' : 'text-slate-900'}`}>{formatLimaTime(afternoon.in)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status and Total */}
                                    <div className="col-span-1 flex flex-row md:flex-col items-center justify-between md:justify-center w-full gap-4">
                                        {(user.isLateMorning || user.isLateAfternoon) ? (
                                            <span className="bg-rose-50 text-rose-600 ring-1 ring-rose-500/10 text-[10px] md:text-[8px] font-black px-4 py-1.5 md:px-3 md:py-1 rounded-full uppercase tracking-tighter shadow-sm shadow-rose-100/50 shrink-0">Tardanza</span>
                                        ) : (
                                            <span className="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10 text-[10px] md:text-[8px] font-black px-4 py-1.5 md:px-3 md:py-1 rounded-full uppercase tracking-tighter shadow-sm shadow-emerald-100/50 shrink-0">Puntual</span>
                                        )}
                                        <p className="text-xl md:text-[16px] font-black text-slate-900 tracking-tighter">
                                            {Math.floor(user.totalMs / 3600000)}h {Math.floor((user.totalMs % 3600000) / 60000)}m
                                        </p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="col-span-1 w-full text-right">
                                        <div className="h-2.5 md:h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner mb-2">
                                            <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (user.totalMs / (8 * 3600000)) * 100)}%` }}></div>
                                        </div>
                                        <span className="text-[10px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest block">{Math.round((user.totalMs / (8 * 3600000)) * 100)}% Jornada</span>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}
            </div>
        </div>
    );
}

// Utility to get hour in Lima Timezone
function getLimaHour(isoString: string) {
    const date = new Date(isoString);
    const hourString = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'America/Lima'
    }).format(date);
    return parseInt(hourString);
}
