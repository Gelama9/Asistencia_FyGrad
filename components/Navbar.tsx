'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    const links = [
        {
            href: '/', label: 'Reporte de Asistencia', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            href: '/devices', label: 'Gestión de Personal', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            href: '/reports/monthly', label: 'Reporte Mensual', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: '/reports/payroll', label: 'Planilla', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            href: '/schedules', label: 'Gestión de Horarios', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-slate-100 shadow-sm shadow-slate-100/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-slate-900">FYGRAD</span>
                            <span className="text-slate-400 font-bold text-[8px] tracking-[0.3em] uppercase">Control de Asistencia</span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-sm ${isActive
                                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-900/5'
                                        : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Navigation */}
                    <div className="md:hidden flex items-center gap-4">
                        {links.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`p-2 rounded-xl transition-all ${isActive
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-400'
                                        }`}
                                    title={link.label}
                                >
                                    {link.icon}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}
