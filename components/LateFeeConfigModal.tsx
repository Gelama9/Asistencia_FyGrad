'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus, Trash2, Clock } from 'lucide-react';
import { updateLateFeeRules, getLateFeeRules } from '@/app/reports-actions';

interface LateFeeRule {
  id?: number;
  block_type: 'morning' | 'afternoon';
  min_minutes: number;
  max_minutes: number | null;
  fee_amount: number;
}

interface LateFeeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LateFeeConfigModal({ isOpen, onClose }: LateFeeConfigModalProps) {
  const [rules, setRules] = useState<LateFeeRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  const fetchRules = async () => {
    setIsLoading(true);
    const result = await getLateFeeRules();
    if (result.success && result.rules) {
      setRules(result.rules.map((r: any) => ({
        ...r,
        fee_amount: parseFloat(r.fee_amount)
      })));
    } else {
      setError(result.error || 'Error al cargar reglas');
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const result = await updateLateFeeRules(rules);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Error al guardar');
    }
    setIsSaving(false);
  };

  const addRule = (type: 'morning' | 'afternoon') => {
    setRules([...rules, { block_type: type, min_minutes: 0, max_minutes: null, fee_amount: 0 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof LateFeeRule, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl ring-1 ring-slate-900/5 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
                Configurar Tasas de Tardanza
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Define los descuentos automáticos por tiempo de llegada
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-rose-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cargando Configuración...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Morning Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                    Bloque Mañana (09:00 AM)
                  </h4>
                  <button 
                    onClick={() => addRule('morning')}
                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                    title="Añadir regla"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {rules.filter(r => r.block_type === 'morning').map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100 group">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Minutos después</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={rule.min_minutes}
                            onChange={(e) => updateRule(rules.indexOf(rule), 'min_minutes', parseInt(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                          />
                          <span className="text-slate-400 text-[10px]">-</span>
                          <input 
                            type="number"
                            value={rule.max_minutes || ''}
                            placeholder="∞"
                            onChange={(e) => updateRule(rules.indexOf(rule), 'max_minutes', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Descuento S/.</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={rule.fee_amount}
                          onChange={(e) => updateRule(rules.indexOf(rule), 'fee_amount', parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-rose-500 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <button 
                        onClick={() => removeRule(rules.indexOf(rule))}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors self-end"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Afternoon Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Bloque Tarde (03:00 PM)
                  </h4>
                  <button 
                    onClick={() => addRule('afternoon')}
                    className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                    title="Añadir regla"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {rules.filter(r => r.block_type === 'afternoon').map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100 group">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Minutos después</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            value={rule.min_minutes}
                            onChange={(e) => updateRule(rules.indexOf(rule), 'min_minutes', parseInt(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                          />
                          <span className="text-slate-400 text-[10px]">-</span>
                          <input 
                            type="number"
                            value={rule.max_minutes || ''}
                            placeholder="∞"
                            onChange={(e) => updateRule(rules.indexOf(rule), 'max_minutes', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold focus:outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Descuento S/.</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={rule.fee_amount}
                          onChange={(e) => updateRule(rules.indexOf(rule), 'fee_amount', parseFloat(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-black text-rose-500 focus:outline-none focus:border-slate-900"
                        />
                      </div>
                      <button 
                        onClick={() => removeRule(rules.indexOf(rule))}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors self-end"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 text-rose-500 bg-rose-50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-sm border border-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] text-xs py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
