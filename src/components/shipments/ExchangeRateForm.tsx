'use client';

import { useState, useEffect } from 'react';
import { updateShipmentExchangeRates } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Save, ArrowRight, RefreshCw, Calculator } from 'lucide-react';
import { calculateShipmentCosts } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';

export function ExchangeRateForm({ shipment }: { shipment: any }) {
    const [isLoading, setIsLoading] = useState(false);

    // Local state for Customs inputs
    const [customsUsd, setCustomsUsd] = useState<number | undefined>(shipment.exchangeRateUsd);
    const [customsEur, setCustomsEur] = useState<number | undefined>(shipment.exchangeRateEur);
    const [customsGbp, setCustomsGbp] = useState<number | undefined>(shipment.exchangeRateGbp);

    // Calculate System CIF dynamically based on current form inputs
    const calculateSystemCif = () => {
        // Construct temporary rates object with current form values
        const currentRates = {
            usd: customsUsd || 0,
            eur: customsEur || 0,
            gbp: customsGbp || 0,
            customsUsd: customsUsd,
            customsEur: customsEur,
            customsGbp: customsGbp,
            // We use standard cross rates for the "System CIF" calculation
            // EUR/USD = Customs EUR / Customs USD
            crossEurToUsd: (customsEur && customsUsd) ? (customsEur / customsUsd) : undefined,
            crossGbpToUsd: (customsGbp && customsUsd) ? (customsGbp / customsUsd) : undefined,
        };

        const { summary } = calculateShipmentCosts(
            shipment.items || [],
            shipment.costLines || [],
            currentRates,
            shipment.hasOriginCert || false,
            shipment.supplier?.currency || 'USD'
        );

        return summary.totalCifUsd;
    };

    const systemCifUsd = calculateSystemCif();

    // Determine if we should show the section (only for non-USD shipments)
    const showCrossSection = shipment.supplier?.currency !== 'USD';

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const getNum = (name: string) => {
            const val = formData.get(name);
            return val ? Number(val) : undefined;
        };

        const data = {
            // Customs (Use State)
            exchangeRateUsd: customsUsd,
            exchangeRateEur: customsEur,
            exchangeRateGbp: customsGbp,

            // Purchase (Use FormData/Uncontrolled)
            purchaseRateUsd: getNum('purchaseRateUsd'),
            purchaseRateEur: getNum('purchaseRateEur'),
            purchaseRateGbp: getNum('purchaseRateGbp'),

            // Conversion
            exchangeRateEurToUsd: getNum('exchangeRateEurToUsd'),
        };

        console.log('ExchangeRateForm submitting:', data);
        await updateShipmentExchangeRates(shipment.id, data);
        setIsLoading(false);
    }

    // Calculated placeholder for EUR/USD
    const impliedEurToUsd = (customsEur && customsUsd) ? (customsEur / customsUsd) : undefined;

    return (
        <Card className="shadow-sm border-slate-200">
            <form onSubmit={handleSubmit}>
                <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                        Tipos de Cambio
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">

                    {/* Main Grid: Purchase vs Customs */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Column 1: Purchase (Real Cost) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-1">
                                Compra (Banco)
                            </h3>
                            <div className="grid gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="purchaseRateUsd" className="text-xs text-slate-600">USD / CLP</Label>
                                    <Input
                                        id="purchaseRateUsd"
                                        name="purchaseRateUsd"
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 975.50"
                                        defaultValue={shipment.purchaseRateUsd}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="purchaseRateEur" className="text-xs text-slate-600">EUR / CLP</Label>
                                    <Input
                                        id="purchaseRateEur"
                                        name="purchaseRateEur"
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 1180.00"
                                        defaultValue={shipment.purchaseRateEur}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Customs (Official) */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wider border-b border-teal-100 pb-1">
                                Aduanero (Oficial)
                            </h3>
                            <div className="grid gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="exchangeRateUsd" className="text-xs text-slate-600">USD / CLP</Label>
                                    <Input
                                        id="exchangeRateUsd"
                                        name="exchangeRateUsd"
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 968.64"
                                        value={customsUsd || ''}
                                        onChange={(e) => setCustomsUsd(Number(e.target.value))}
                                        className="h-8 text-sm border-teal-100 focus:border-teal-300 focus:ring-teal-100"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="exchangeRateEur" className="text-xs text-slate-600">EUR / CLP</Label>
                                    <Input
                                        id="exchangeRateEur"
                                        name="exchangeRateEur"
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 1150.00"
                                        value={customsEur || ''}
                                        onChange={(e) => setCustomsEur(Number(e.target.value))}
                                        className="h-8 text-sm border-teal-100 focus:border-teal-300 focus:ring-teal-100"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Section */}
                    <div className="pt-2 border-t border-slate-100">
                        <div className="mb-3">
                            <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                                CONVERSIÓN A USD
                            </h3>
                            <p className="text-[10px] text-slate-500">(Para convertir mercadería en EUR a USD)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <Label htmlFor="exchangeRateEurToUsd" className="text-xs text-slate-600">EUR / USD</Label>
                                <Input
                                    id="exchangeRateEurToUsd"
                                    name="exchangeRateEurToUsd"
                                    type="number"
                                    step="any"
                                    placeholder={impliedEurToUsd ? `${impliedEurToUsd.toFixed(6)} (Auto)` : "Auto..."}
                                    defaultValue={shipment.exchangeRateEurToUsd}
                                    className="h-8 text-sm text-right border-indigo-100 focus:border-indigo-300 focus:ring-indigo-100"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Si vacío: {impliedEurToUsd ? impliedEurToUsd.toFixed(6) : '-'} (Calculado: Aduana EUR / Aduana USD)
                                </p>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="pt-0 pb-4 flex justify-end bg-slate-50/50 pt-3 border-t border-slate-100 rounded-b-lg">
                    <Button type="submit" size="sm" className="h-8 bg-slate-900 text-white hover:bg-slate-800" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
                        Guardar Cambios
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
