import { db } from '@/db';
import { devices } from '@/db/schema';
import { desc } from 'drizzle-orm';
import DeviceList from '@/components/DeviceList';
import { updateDevice, createDevice, deleteDevice } from '@/app/actions';

interface Device {
    device_id: string;
    display_name: string;
    salary_per_block: string;
}

export const dynamic = 'force-dynamic';

async function getDevices(): Promise<Device[]> {
    const records = await db.select({
        device_id: devices.deviceId,
        display_name: devices.displayName,
        salary_per_block: devices.salaryPerBlock,
    })
    .from(devices)
    .orderBy(desc(devices.createdAt));
    
    return records as any[];
}


export default async function DevicesPage() {
    const devices = await getDevices();

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 uppercase">GESTIÓN DE PERSONAL</h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase mt-1">Configuración de Nombres y Dispositivos</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <section className="bg-white rounded-[3rem] p-8 text-slate-900 ring-1 ring-slate-900/5 shadow-2xl shadow-slate-200/40 col-span-1 md:col-span-2 lg:col-span-2">
                    <header className="mb-8">
                        <h3 className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400 mb-1">Directorio</h3>
                        <p className="text-xl font-black text-slate-900 leading-tight">Vincular Nombres a IDs</p>
                    </header>
                    <DeviceList 
                        devices={devices} 
                        updateAction={updateDevice} 
                        createAction={createDevice}
                        deleteAction={deleteDevice}
                    />
                </section>

                <aside className="space-y-8">
                    <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Instrucciones</h4>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Aquí puedes asignar un nombre amigable a cada identificador de dispositivo (ID).
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                Esto permite que el reporte de asistencia muestre el nombre del colaborador en lugar del ID técnico.
                            </p>
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Importante</p>
                                <p className="text-xs font-bold text-amber-900">Asegúrate de verificar el ID antes de cambiar el nombre.</p>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
