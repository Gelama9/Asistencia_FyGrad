'use server';

import { encrypt } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (email === 'fygrad@gmail.com' && password === 'QWEASDZC123') {
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        const session = await encrypt({ 
            user: { email, name: 'Admin' }, 
            expires 
        });

        (await cookies()).set('session', session, { 
            expires, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        redirect('/');
    }

    return { error: 'Credenciales inválidas' };
}

export async function logoutAction() {
    (await cookies()).set('session', '', { expires: new Date(0), path: '/' });
    redirect('/login');
}
