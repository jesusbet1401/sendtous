'use client';

import { useState } from 'react';
import { updateShipmentExchangeRates } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

export function ExchangeRateForm({ shipment }: { shipment: any }) {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            exchangeRateUsd: formData.get('exchangeRateUsd') ? Number(formData.get('exchangeRateUsd')) : undefined,
            exchangeRateEur: formData.get('exchangeRateEur') ? Number(formData.get('exchangeRateEur')) : undefined,
            exchangeRateGbp: formData.get('exchangeRateGbp') ? Number(formData.get('exchangeRateGbp')) : undefined,
        };

        await updateShipmentExchangeRates(shipment.id, data);
        setIsLoading(false);
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Tipos de Cambio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="exchangeRateUsd" className="text-xs">USD / CLP</Label>
                            <Input
                                id="exchangeRateUsd"
                                name="exchangeRateUsd"
                                type="number"
                                step="0.01"
                                defaultValue={shipment.exchangeRateUsd}
                                className="h-8"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="exchangeRateEur" className="text-xs">EUR / CLP</Label>
                            <Input
                                id="exchangeRateEur"
                                name="exchangeRateEur"
                                type="number"
                                step="0.01"
                                defaultValue={shipment.exchangeRateEur}
                                className="h-8"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="exchangeRateGbp" className="text-xs">GBP / CLP</Label>
                            <Input
                                id="exchangeRateGbp"
                                name="exchangeRateGbp"
                                type="number"
                                step="0.01"
                                defaultValue={shipment.exchangeRateGbp}
                                className="h-8"
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4 flex justify-end">
                    <Button type="submit" size="sm" variant="ghost" className="h-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                        Actualizar
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
