'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupplier } from '@/app/actions/suppliers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function SupplierForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get('name') as string,
            country: formData.get('country') as string,
            currency: formData.get('currency') as 'USD' | 'EUR' | 'GBP' | 'CLP',
            contactName: formData.get('contactName') as string,
            contactEmail: formData.get('contactEmail') as string,
            contactPhone: formData.get('contactPhone') as string,
            address: formData.get('address') as string,
            notes: formData.get('notes') as string,
        };

        const result = await createSupplier(data);

        if (result.success) {
            router.push('/suppliers');
        } else {
            setError(result.error as string);
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/suppliers">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Nuevo Proveedor</h1>
            </div>

            <Card className="max-w-[600px] mx-auto shadow-sm">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Información del Proveedor</CardTitle>
                        <CardDescription>
                            Registra los datos de tu nuevo socio comercial.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Empresa</h3>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Razón Social <span className="text-destructive">*</span></Label>
                                <Input id="name" name="name" placeholder="Ej. Sony Corporation" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="country">País <span className="text-destructive">*</span></Label>
                                    <Input id="country" name="country" placeholder="Ej. Japón" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Moneda <span className="text-destructive">*</span></Label>
                                    <Select name="currency" defaultValue="USD">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD - Dólar</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            <SelectItem value="GBP">GBP - Libra</SelectItem>
                                            <SelectItem value="CLP">CLP - Peso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input id="address" name="address" placeholder="Dirección comercial completa" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Contacto</h3>

                            <div className="grid gap-2">
                                <Label htmlFor="contactName">Nombre Contacto</Label>
                                <Input id="contactName" name="contactName" placeholder="Nombre completo" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="contactEmail">Email</Label>
                                    <Input id="contactEmail" name="contactEmail" type="email" placeholder="correo@ejemplo.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contactPhone">Teléfono</Label>
                                    <Input id="contactPhone" name="contactPhone" placeholder="+56 9..." />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea id="notes" name="notes" placeholder="Información adicional..." className="min-h-[100px]" />
                        </div>

                        <div className="bg-teal-50 border-l-4 border-teal-600 p-4 rounded-r-md flex gap-3">
                            <Info className="h-5 w-5 text-teal-600 mt-0.5" />
                            <div className="text-sm text-teal-900">
                                <p className="font-medium">Importante</p>
                                La moneda base será utilizada para los cálculos automáticos.
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-end gap-3 border-t bg-muted/50 px-6 py-4">
                        <Link href="/suppliers">
                            <Button variant="outline" type="button">Cancelar</Button>
                        </Link>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Proveedor
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
