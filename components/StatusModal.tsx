'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { saveStatusOverride } from '@/app/reports-actions';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  dateKey: string;
  blockType: 'morning' | 'afternoon';
  initialStatus?: string;
  initialNotes?: string;
  initialPayment?: number;
  initialIn?: string | null;
  initialOut?: string | null;
}

export default function StatusModal({
  isOpen,
  onClose,
  userId,
  userName,
  dateKey,
  blockType,
  initialStatus = 'Ninguno',
  initialNotes = '',
  initialPayment = 0,
  initialIn = null,
  initialOut = null
}: StatusModalProps) {
  const formatForInput = (iso: string | null) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false,
        timeZone: 'America/Lima' 
      }).format(new Date(iso));
    } catch (e) {
      return '';
    }
  };

  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [payment, setPayment] = useState(initialPayment.toString());
  const [inTime, setInTime] = useState(formatForInput(initialIn));
  const [outTime, setOutTime] = useState(formatForInput(initialOut));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('dateKey', dateKey);
    formData.append('blockType', blockType);
    formData.append('status', status);
    formData.append('notes', notes);
    formData.append('paymentAmount', payment);
    
    // Create ISO strings for the times
    if (inTime) {
      formData.append('inTime', `${dateKey}T${inTime}:00`);
    }
    if (outTime) {
      formData.append('outTime', `${dateKey}T${outTime}:00`);
    }

    const result = await saveStatusOverride(formData);
    
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al guardar');
    }
    setIsSaving(false);
  };

  const statusOptions = [
    { id: 'Puntual', label: 'Puntual', color: 'bg-emerald-500' },
    { id: 'Tardanza', label: 'Tardanza', color: 'bg-rose-500' },
    { id: 'Permiso', label: 'Permiso', color: 'bg-rose-500' },
    { id: 'Inasistencia', label: 'Inasistencia', color: 'bg-rose-700' },
    { id: 'Ninguno', label: 'Sin Estado', color: 'bg-slate-300' }
  ];

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    if (newStatus === 'Inasistencia') {
      setPayment('46.00');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                Gestionar Bloque
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {userName} • {dateKey} • {blockType === 'morning' ? 'Mañana' : 'Tarde'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado del Bloque</label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleStatusChange(opt.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all font-bold text-xs
                      ${status === opt.id 
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg' 
                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}
                    `}
                  >
                    <div className={`h-2 w-2 rounded-full ${status === opt.id ? 'bg-white' : opt.color}`}></div>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Overrides */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora de Entrada</label>
                <input
                  type="time"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora de Salida</label>
                <input
                  type="time"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors"
                />
              </div>
            </div>

            {/* Late Fee / Discount Amount */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descuento / Costo Tardanza (S/.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-colors pl-12"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">S/.</span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 italic px-1">
                Este monto se restará del pago base de S/. 46.00 por bloque.
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas Adicionales</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors min-h-[100px] resize-none"
                placeholder="Escribe algún comentario o permiso..."
              ></textarea>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Cambios
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
