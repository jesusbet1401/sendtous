'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShipment } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, CalendarIcon } from 'lucide-react';
import Link from 'next/link';

interface Supplier {
    id: string;
    name: string;
}

export function ShipmentForm({ suppliers }: { suppliers: Supplier[] }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            reference: formData.get('reference') as string,
            supplierId: formData.get('supplierId') as string,
            transportMethod: formData.get('transportMethod') as 'MARITIME' | 'AIR',
            origin: formData.get('origin') as string,
            destination: formData.get('destination') as string,
            etd: formData.get('etd') ? new Date(formData.get('etd') as string) : undefined,
            eta: formData.get('eta') ? new Date(formData.get('eta') as string) : undefined,
            blOrAwb: formData.get('blOrAwb') as string,
            carrier: formData.get('carrier') as string,
        };

        const result = await createShipment(data);

        if (result.success) {
            router.push(`/shipments/${result.data?.id}`); // Redirect to details/items page
        } else {
            setError(result.error as string);
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/shipments">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">Nuevo Embarque</h1>
            </div>

            <Card className="max-w-[700px] mx-auto shadow-sm">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Cabecera del Embarque</CardTitle>
                        <CardDescription>
                            Inicia un nuevo registro. Podrás agregar productos en el siguiente paso.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="reference">Referencia Interna <span className="text-destructive">*</span></Label>
                                    <Input id="reference" name="reference" placeholder="Ej. IMP-2024-001" required autoFocus />
                                    <p className="text-[0.8rem] text-muted-foreground">Código único para identificar este embarque.</p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="supplierId">Proveedor <span className="text-destructive">*</span></Label>
                                    <Select name="supplierId" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="transportMethod">Método de Transporte <span className="text-destructive">*</span></Label>
                                    <Select name="transportMethod" defaultValue="MARITIME" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MARITIME">Marítimo</SelectItem>
                                            <SelectItem value="AIR">Aéreo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="blOrAwb">BL / AWB</Label>
                                    <Input id="blOrAwb" name="blOrAwb" placeholder="Documento de transporte" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="carrier">Transportista / Naviera</Label>
                                    <Input id="carrier" name="carrier" placeholder="Ej. Maersk, DHL" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                            <div className="grid gap-2">
                                <Label htmlFor="origin">Puerto Origen</Label>
                                <Input id="origin" name="origin" placeholder="Ej. Shanghai" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="destination">Puerto Destino</Label>
                                <Input id="destination" name="destination" placeholder="Ej. Valparaíso" defaultValue="Valparaíso" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="etd">ETD (Estimated Time of Departure)</Label>
                                <Input id="etd" name="etd" type="date" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="eta">ETA (Estimated Time of Arrival)</Label>
                                <Input id="eta" name="eta" type="date" />
                            </div>
                        </div>

                    </CardContent>

                    <CardFooter className="flex justify-end gap-3 border-t bg-muted/50 px-6 py-4">
                        <Link href="/shipments">
                            <Button variant="outline" type="button">Cancelar</Button>
                        </Link>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear y Continuar
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
