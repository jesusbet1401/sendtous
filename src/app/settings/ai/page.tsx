'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast'; // Assuming toast hook exists
import { getSystemConfig, upsertSystemConfig } from '@/app/actions/settings';
import { Loader2, Check, Lock } from 'lucide-react';

export default function AISettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        setIsLoading(true);
        const res = await getSystemConfig('OPENAI_API_KEY');
        if (res.success && res.data) {
            setApiKey(res.data);
        }
        setIsLoading(false);
    }

    async function handleSave() {
        setIsSaving(true);
        const res = await upsertSystemConfig('OPENAI_API_KEY', apiKey);
        setIsSaving(false);

        if (res.success) {
            toast({
                title: 'Configuración guardada',
                description: 'La API Key de OpenAI ha sido actualizada.',
            });
        } else {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la configuración.',
                variant: 'destructive',
            });
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Configuración de Inteligencia Artificial</h3>
                <p className="text-sm text-muted-foreground">
                    Gestiona las credenciales para el asistente de importaciones.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>OpenAI API Key</CardTitle>
                    <CardDescription>
                        Ingresa tu API Key de OpenAI para habilitar el chat inteligente.
                        Esta clave se guardará de forma segura en la base de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label htmlFor="apiKey">API Key (sk-...)</Label>
                    <div className="flex gap-2 relative">
                        <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            id="apiKey"
                            placeholder="sk-..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            type="password"
                            className="pl-9"
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} disabled={isSaving || isLoading} className="bg-teal-600 hover:bg-teal-700">
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
