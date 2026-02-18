'use client';

import { useActionState } from 'react';
import { authenticate } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <form action={dispatch} className="space-y-6 w-full max-w-sm">
            <div className="space-y-2 text-center pb-4">
                <h1 className="text-3xl font-bold text-slate-900">Iniciar Sesión</h1>
                <p className="text-slate-500">Bienvenido a Sendtous Import Manager</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        placeholder="tu@email.com"
                        required
                        className="h-12"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        required
                        minLength={5}
                        className="h-12"
                    />
                </div>
            </div>

            {errorMessage && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 font-medium"
                disabled={isPending}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando...
                    </>
                ) : (
                    'Ingresar'
                )}
            </Button>

            <div className="text-center text-sm text-slate-400 pt-4">
                © {new Date().getFullYear()} Sendtous. Todos los derechos reservados.
            </div>
        </form>
    );
}
