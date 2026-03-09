'use client';

import { useState } from 'react';
import { loginAction } from './actions';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await loginAction(formData);
            if (result?.error) {
                setError(result.error);
            }
        } catch (e) {
            setError('Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden font-[family-name:var(--font-geist-sans)]">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group hover:border-blue-500/50 transition-colors">
                            <Lock className="w-8 h-8 text-white group-hover:text-blue-400 transition-colors" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
                        <p className="text-gray-400 text-sm">Ingresa tus credenciales para continuar</p>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 block ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="fygrad@gmail.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400 block ml-1">Contraseña</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-white/90 text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
                
                <p className="mt-8 text-center text-gray-500 text-xs">
                    &copy; 2026 Fygrad. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
