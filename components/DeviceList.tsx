'use client';

import React, { useState } from 'react';

interface Device {
    device_id: string;
    display_name: string;
    salary_per_block: string;
}

interface DeviceListProps {
    devices: Device[];
    updateAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
    createAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
    deleteAction: (formData: FormData) => Promise<{ success?: boolean; error?: string }>;
}

export default function DeviceList({ devices, updateAction, createAction, deleteAction }: DeviceListProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newId, setNewId] = useState('');
    const [newSalary, setNewSalary] = useState('');
    
    // Create form state
    const [isCreating, setIsCreating] = useState(false);
    const [createDeviceId, setCreateDeviceId] = useState('');
    const [createDisplayName, setCreateDisplayName] = useState('');
    const [createSalary, setCreateSalary] = useState('46.00');

    // Delete confirmation state
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const handleEdit = (device: Device) => {
        setEditingId(device.device_id);
        setNewName(device.display_name);
        setNewId(device.device_id);
        setNewSalary(device.salary_per_block);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewName('');
        setNewId('');
        setNewSalary('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('deviceId', createDeviceId);
        formData.append('displayName', createDisplayName);
        formData.append('salaryPerBlock', createSalary);
        const res = await createAction(formData);
        if (res.success) {
            setIsCreating(false);
            setCreateDeviceId('');
            setCreateDisplayName('');
            setCreateSalary('46.00');
        } else {
            alert(res.error || 'Error al crear');
        }
    };

    const handleDelete = async (deviceId: string) => {
        const formData = new FormData();
        formData.append('deviceId', deviceId);
        const res = await deleteAction(formData);
        if (res.success) {
            setConfirmDeleteId(null);
        } else {
            alert(res.error || 'Error al eliminar');
        }
    };

    return (
        <div className="space-y-6">
            {/* Create Form Section */}
            {!isCreating ? (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full bg-slate-900 border-2 border-slate-900 rounded-[2rem] p-4 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                    Añadir Nuevo Personal
                </button>
            ) : (
                <form onSubmit={handleCreate} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-6 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuevo Registro</h4>
                        <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">ID del Dispositivo</label>
                            <input 
                                required
                                placeholder="Ejj: 905ea9..."
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900"
                                value={createDeviceId}
                                onChange={(e) => setCreateDeviceId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">Nombre Completo</label>
                            <input 
                                required
                                placeholder="Ejj: Juan Perez"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900"
                                value={createDisplayName}
                                onChange={(e) => setCreateDisplayName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">Pago por Bloque (S/)</label>
                            <input 
                                required
                                type="number"
                                step="0.10"
                                placeholder="46.00"
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900"
                                value={createSalary}
                                onChange={(e) => setCreateSalary(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-slate-900 rounded-2xl py-3 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-slate-900/20"
                    >
                        Confirmar Registro
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {devices.map((device) => {
                    const isEditing = editingId === device.device_id;
                    const isConfirmingDelete = confirmDeleteId === device.device_id;

                    return (
                        <div key={device.device_id} className="bg-white border border-slate-100 rounded-[1.5rem] p-4 transition-all hover:bg-slate-50 hover:shadow-lg shadow-slate-200/40 relative overflow-hidden group">
                            {isEditing ? (
                                <form action={async () => {
                                    const formData = new FormData();
                                    formData.append('oldId', device.device_id);
                                    formData.append('newId', newId);
                                    formData.append('newName', newName);
                                    formData.append('newSalary', newSalary);
                                    await updateAction(formData);
                                    setEditingId(null);
                                }} className="space-y-3">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">ID del Dispositivo</label>
                                            <input
                                                value={newId}
                                                onChange={(e) => setNewId(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900 shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">Nombre Completo</label>
                                            <input
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                autoFocus
                                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900 shadow-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter ml-1">Pago por Bloque (S/)</label>
                                            <input
                                                type="number"
                                                step="0.10"
                                                value={newSalary}
                                                onChange={(e) => setNewSalary(e.target.value)}
                                                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold w-full focus:outline-none focus:ring-2 focus:ring-slate-900/5 text-slate-900 shadow-sm"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-slate-900 rounded-xl px-6 py-2 text-white text-[10px] font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-md shadow-slate-900/20"
                                            >
                                                Guardar Cambios
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : isConfirmingDelete ? (
                                <div className="flex flex-col items-center justify-center p-2 space-y-3 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight text-center">¿Eliminar permanentemente a {device.display_name}?</p>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 px-4 py-2"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(device.device_id)}
                                            className="bg-red-500 rounded-xl px-5 py-2 text-white text-[9px] font-black uppercase shadow-lg shadow-red-200 hover:bg-red-600 transition-colors"
                                        >
                                            Confirmar Eliminar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col overflow-hidden mr-2">
                                        <span className="text-sm font-black text-slate-800 tracking-tight truncate">{device.display_name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate opacity-60">ID: {device.device_id}</span>
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">S/ {parseFloat(device.salary_per_block).toFixed(2)} / bloque</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(device)}
                                            className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            title="Editar nombre"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(device.device_id)}
                                            className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title="Eliminar dispositivo"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

