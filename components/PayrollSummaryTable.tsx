'use client';

import React, { useState } from 'react';
import { PayrollEmployeeSummary } from '@/app/reports-data';
import { updateEmployeeMonthlySummary } from '@/app/reports-actions';
import { Save, AlertCircle, Edit2, Check, X } from 'lucide-react';

interface PayrollSummaryTableProps {
  data: PayrollEmployeeSummary[];
  monthKey: string;
}

export default function PayrollSummaryTable({ data, monthKey }: PayrollSummaryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ advance: 0, regularize: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (user: PayrollEmployeeSummary) => {
    setEditingId(user.userId);
    setEditFields({ advance: user.advance, regularize: user.regularize });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSave = async (userId: string) => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('monthKey', monthKey);
    formData.append('advanceAmount', editFields.advance.toString());
    formData.append('regularizeAmount', editFields.regularize.toString());
    
    const result = await updateEmployeeMonthlySummary(formData);
    if (result.success) {
      setEditingId(null);
    } else {
      alert('Error saving data');
    }
    setIsSaving(false);
  };

  const totals = data.reduce((acc, curr) => ({
    discount: acc.discount + curr.totalDiscount,
    established: acc.established + curr.establishedPay,
    totalPay: acc.totalPay + curr.totalPay,
    advance: acc.advance + curr.advance,
    remaining: acc.remaining + curr.remaining,
    regularize: acc.regularize + curr.regularize,
    final: acc.final + curr.finalPay
  }), { discount: 0, established: 0, totalPay: 0, advance: 0, remaining: 0, regularize: 0, final: 0 });

  return (
    <div className="space-y-12">
      {/* Table 1: PAGO DE MES */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-[0.3em]">Pago del Mes ({monthKey})</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resumen de Asistencia y Adelantos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 italic">
                <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Trabajadores</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Descuento</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Pagos Establecidos</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Pago</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Adelanto</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Restante</th>
                <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 text-sm font-black text-slate-900 uppercase tracking-tighter">{user.displayName}</td>
                  <td className="p-4 text-right text-sm font-bold text-rose-500 font-mono">S/. {user.totalDiscount.toFixed(2)}</td>
                  <td className="p-4 text-right text-sm font-bold text-slate-400 font-mono">S/. {user.establishedPay.toFixed(2)}</td>
                  <td className="p-4 text-right text-sm font-black text-slate-900 font-mono">S/. {user.totalPay.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    {editingId === user.userId ? (
                      <input 
                        type="number"
                        value={editFields.advance}
                        onChange={(e) => setEditFields({ ...editFields, advance: parseFloat(e.target.value) })}
                        className="w-24 bg-white border-2 border-slate-900 rounded-lg p-1 text-right text-sm font-black focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-900 font-mono">S/. {user.advance.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-sm font-black text-emerald-600 bg-emerald-50/30 font-mono">S/. {user.remaining.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    {editingId === user.userId ? (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => handleSave(user.userId)} className="p-2 bg-slate-900 text-white rounded-lg hover:scale-110 transition-transform">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:text-rose-500">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(user)} className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-black uppercase">
                <td className="p-4 text-xs tracking-widest">Total</td>
                <td className="p-4 text-right text-xs font-mono">S/. {totals.discount.toFixed(2)}</td>
                <td className="p-4 text-right text-xs font-mono">S/. {totals.established.toFixed(2)}</td>
                <td className="p-4 text-right text-xs font-mono bg-white/10">S/. {totals.totalPay.toFixed(2)}</td>
                <td className="p-4 text-right text-xs font-mono">S/. {totals.advance.toFixed(2)}</td>
                <td colSpan={2} className="p-4 text-right text-xs font-mono bg-emerald-500/20 text-emerald-400">S/. {totals.remaining.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: PAGO DEL MES + REGULARIZACIÓN */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 overflow-hidden">
        <div className="p-6 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Pago con Regularización</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes de Meses Anteriores</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                <th className="p-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Trabajadores</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Pago del Mes</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Regularizar</th>
                <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pago Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((user) => (
                <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm font-black text-slate-900 uppercase tracking-tighter">{user.displayName}</td>
                  <td className="p-4 text-right text-sm font-bold text-slate-400 font-mono">S/. {user.totalPay.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    {editingId === user.userId ? (
                      <input 
                        type="number"
                        value={editFields.regularize}
                        onChange={(e) => setEditFields({ ...editFields, regularize: parseFloat(e.target.value) })}
                        className="w-24 bg-white border-2 border-slate-900 rounded-lg p-1 text-right text-sm font-black focus:outline-none"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-900 font-mono bg-amber-50 px-3 py-1 rounded-full border border-amber-100">S/. {user.regularize.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-lg font-black text-slate-900 bg-slate-50/50 font-mono">S/. {user.finalPay.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
