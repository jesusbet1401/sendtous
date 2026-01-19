'use client';

import { useMemo, useOptimistic, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { calculateShipmentCosts } from '@/lib/calculations';
import { Package, DollarSign, TrendingUp, Calculator, FileCheck, AlertTriangle, TrendingDown } from 'lucide-react';
import { updateShipmentCertificate } from '@/app/actions/shipments';

interface ShipmentKPIsProps {
    shipmentId: string;
    items: any[];
    costLines: any[];
    exchangeRates: { usd: number; eur: number; gbp: number };
    currency?: string;
    hasOriginCert?: boolean;
}

export function ShipmentKPIs({
    shipmentId,
    items,
    costLines,
    exchangeRates,
    currency = 'USD',
    hasOriginCert = false
}: ShipmentKPIsProps) {

    // Optimistic state for immediate UI feedback
    const [optimisticCert, setOptimisticCert] = useOptimistic(
        hasOriginCert,
        (state, newStatus: boolean) => newStatus
    );

    const handleToggle = (checked: boolean) => {
        startTransition(() => {
            setOptimisticCert(checked);
            updateShipmentCertificate(shipmentId, checked);
        });
    };

    const { summary } = useMemo(() => {
        return calculateShipmentCosts(items, costLines, exchangeRates, optimisticCert);
    }, [items, costLines, exchangeRates, optimisticCert]);

    const factor = summary.totalFobUsd > 0
        ? (summary.totalCostClp / summary.totalFobUsd).toFixed(2)
        : '-';

    return (
        <div className="space-y-4">
            {/* Certificate of Origin Toggle */}
            <Card className={optimisticCert ? 'border-green-300 bg-green-50/50' : 'border-orange-200 bg-orange-50/30'}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {optimisticCert ? (
                                <div className="p-2 rounded-lg bg-green-100">
                                    <FileCheck className="h-5 w-5 text-green-600" />
                                </div>
                            ) : (
                                <div className="p-2 rounded-lg bg-orange-100">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                </div>
                            )}
                            <div>
                                <Label htmlFor="cert-toggle" className="text-sm font-medium cursor-pointer">
                                    ¿Tiene Certificado de Origen?
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {optimisticCert
                                        ? 'Exento de Ad Valorem por TLC'
                                        : 'Se aplicará 6% sobre valor CIF'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {optimisticCert ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                    TLC Activo - 0% Arancel
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                                    Sin TLC - 6% Ad Valorem
                                </Badge>
                            )}
                            <Switch
                                id="cert-toggle"
                                checked={optimisticCert}
                                onCheckedChange={handleToggle}
                            />
                        </div>
                    </div>
                    {!optimisticCert && summary.savingsWithTlc > 0 && (
                        <div className="mt-3 pt-3 border-t border-orange-200 flex items-center gap-2 text-sm">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <span className="text-muted-foreground">Ahorro potencial con TLC:</span>
                            <span className="font-semibold text-green-600">
                                {formatCurrency(summary.savingsWithTlc, 'CLP')}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Total FOB ({currency})</div>
                            <div className="text-xl font-bold text-slate-700">{formatCurrency(summary.totalFobUsd, currency)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-50">
                            <TrendingUp className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Total CIF (USD)</div>
                            <div className="text-xl font-bold text-slate-700">{formatCurrency(summary.totalCifUsd)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-teal-200">
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-teal-100">
                            <Calculator className="h-5 w-5 text-teal-700" />
                        </div>
                        <div>
                            <div className="text-xs text-teal-800 font-medium">Factor (CLP/USD)</div>
                            <div className="text-xl font-bold text-teal-700">{factor}</div>
                            <div className="text-[10px] text-teal-600">1 USD FOB = X CLP Puesto</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-teal-600 text-white border-none shadow-md">
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/20">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-teal-100">Costo Total (CLP)</div>
                            <div className="text-xl font-bold">{formatCurrency(summary.totalCostClp, 'CLP')}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown Table */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Estructura de Costos</CardTitle>
                        {optimisticCert ? (
                            <Badge className="bg-green-600">TLC Activo</Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">Sin TLC</Badge>
                        )}
                    </div>
                    <CardDescription>Desglose de costos e impuestos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-medium">Concepto</TableHead>
                                    <TableHead className="text-right font-medium">USD</TableHead>
                                    <TableHead className="text-right font-medium">CLP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="text-sm">Valor FOB</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalFobUsd)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalFobUsd * exchangeRates.usd, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-sm text-muted-foreground">+ Flete</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(summary.totalFreightUsd)}</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(summary.totalFreightUsd * exchangeRates.usd, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-sm text-muted-foreground">+ Seguro</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(summary.totalInsuranceUsd)}</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(summary.totalInsuranceUsd * exchangeRates.usd, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow className="bg-blue-50/50 font-medium">
                                    <TableCell className="text-sm">= Valor CIF</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalCifUsd)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalCifClp, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow className={optimisticCert ? 'bg-green-50/50' : ''}>
                                    <TableCell className="text-sm">
                                        + Ad Valorem (6%)
                                        {optimisticCert && <span className="ml-2 text-green-600 text-xs">Exento</span>}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {optimisticCert ? (
                                            <span className="text-green-600">$0.00</span>
                                        ) : (
                                            formatCurrency(summary.totalAdValorem / exchangeRates.usd)
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                        {optimisticCert ? (
                                            <span className="text-green-600">CLP 0</span>
                                        ) : (
                                            formatCurrency(summary.totalAdValorem, 'CLP')
                                        )}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="text-sm">+ Gastos Locales</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalGlobalExpensesClp / exchangeRates.usd)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalGlobalExpensesClp, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow className="bg-teal-50 font-bold border-t-2 border-teal-200">
                                    <TableCell className="text-sm text-teal-800">= Costo Total</TableCell>
                                    <TableCell className="text-right text-sm text-teal-800">{formatCurrency(summary.totalCostClp / exchangeRates.usd)}</TableCell>
                                    <TableCell className="text-right text-sm text-teal-800">{formatCurrency(summary.totalCostClp, 'CLP')}</TableCell>
                                </TableRow>
                                <TableRow className="text-muted-foreground italic">
                                    <TableCell className="text-sm">IVA (19%) - Recuperable</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalVat / exchangeRates.usd)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatCurrency(summary.totalVat, 'CLP')}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
