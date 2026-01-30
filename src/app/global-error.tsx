'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body className="bg-slate-50 min-h-screen flex items-center justify-center p-6 text-center text-slate-900 font-sans">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-xl border border-red-100">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-100 rounded-full">
                            <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Error Crítico</h2>
                    <div className="bg-slate-100 p-4 rounded-md text-left text-xs font-mono text-slate-600 overflow-auto max-h-40 mb-6">
                        {error.message || 'Error desconocido'}
                    </div>
                    <p className="text-slate-600 mb-8">
                        Ha ocurrido un error irrecuperable en la estructura principal de la aplicación.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Recargar Completamente
                        </Button>
                        <Button onClick={() => reset()}>
                            Intentar Recuperar
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
