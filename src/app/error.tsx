'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <Card className="max-w-md w-full border-destructive/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-xl text-slate-800">Algo salió mal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="bg-slate-100 p-3 rounded-md text-left text-xs font-mono text-slate-600 overflow-auto max-h-32">
                        {error.message || 'Error desconocido'}
                    </div>
                    <p className="text-slate-600">
                        Ocurrió un error inesperado en la aplicación. Revisa la consola para más detalles.
                    </p>
                    <div className="flex gap-2 justify-center pt-2">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Recargar Página
                        </Button>
                        <Button onClick={() => reset()}>
                            Intentar Recuperar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
