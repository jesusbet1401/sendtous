'use client';

import { useMemo, useOptimistic, startTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { calculateShipmentCosts } from '@/lib/calculations';
import { Package, DollarSign, TrendingUp, Calculator, FileCheck, AlertTriangle, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { saveShipmentCalculatedCosts, updateShipmentCertificate } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Check } from 'lucide-react';
import { useState } from 'react';

interface ShipmentKPIsProps {
    shipmentId: string;
    items: any[];
    costLines: any[];
    exchangeRates: {
        usd: number; eur: number; gbp: number;
        customsUsd?: number; customsEur?: number; customsGbp?: number;
        purchaseUsd?: number; purchaseEur?: number; purchaseGbp?: number;
        crossEurToUsd?: number; crossGbpToUsd?: number;
        exchangeRateEurToUsd?: number;
    };
    currency?: string;
    hasOriginCert?: boolean;
}

export function ShipmentKPIs({
    shipmentId,
    items,
    costLines,
    exchangeRates,
    currency = 'USD', // Source currency (e.g., EUR)
    hasOriginCert = false
}: ShipmentKPIsProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

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

    const { summary, calculatedItems } = useMemo(() => {
        return calculateShipmentCosts(items, costLines, exchangeRates, optimisticCert, currency as 'USD' | 'EUR' | 'GBP' | 'CLP');
    }, [items, costLines, exchangeRates, optimisticCert, currency]);

    const handleSaveCosts = async () => {
        setIsSaving(true);
        try {
            if (!calculatedItems || calculatedItems.length === 0) {
                return;
            }

            const itemCosts = calculatedItems.map(item => ({
                itemId: item.id,
                unitCostClp: Number.isFinite(item.unitCostClp) ? item.unitCostClp : 0
            }));

            if (itemCosts.some(i => i.unitCostClp === 0 || !Number.isFinite(i.unitCostClp))) {
                console.warn("Hay items con costo 0 o invalido.");
                // We continue but maybe should warn? For now let's just save.
            }

            const result = await saveShipmentCalculatedCosts(shipmentId, itemCosts);

            if (result.success) {
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 3000);
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate factors
    const factorCustoms = summary.totalFobUsd > 0
        ? (summary.totalCifClp / summary.totalFobUsd).toFixed(2) // Official Factor
        : '-';

    // Real Factor: Total Real Cost / Total FOB Original
    const factorReal = summary.totalFobUsd > 0
        ? (summary.totalCostClp / summary.totalFobUsd).toFixed(2)
        : '-';

    return (
        <div className="space-y-6">
            <div className="flex justify-end items-center gap-4">
                <Button
                    onClick={handleSaveCosts}
                    disabled={isSaving || items.length === 0 || justSaved}
                    variant={justSaved ? "default" : "outline"}
                    className={justSaved ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"}
                >
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : justSaved ? (
                        <Check className="mr-2 h-4 w-4" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {justSaved ? "Costos Actualizados" : "Actualizar Costos de Productos"}
                </Button>
            </div>
            {/* Top Cards - High Level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Total FOB ({currency})</div>
                            <div className="text-xl font-bold text-slate-700">
                                {formatCurrency(summary.totalFobUsd, currency)}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-50">
                            <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
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
                            <div className="text-xs text-teal-800 font-medium">Factor Real (CLP/{currency})</div>
                            <div className="text-xl font-bold text-teal-700">{factorReal}</div>
                            <div className="text-[10px] text-teal-600">Considera TC Compra</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-teal-600 text-white border-none shadow-md">
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/20">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-teal-100">Costo Total Real</div>
                            <div className="text-xl font-bold">{formatCurrency(summary.totalCostClp, 'CLP')}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Structure Table - Main Focus */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Estructura de Costos (Aduana)</CardTitle>
                                    <CardDescription>Cálculo oficial de impuestos basado en Valor Aduanero</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="cert-toggle"
                                        checked={optimisticCert}
                                        onCheckedChange={handleToggle}
                                    />
                                    <Label htmlFor="cert-toggle" className="text-xs cursor-pointer">
                                        {optimisticCert ? (
                                            <Badge className="bg-green-600 hover:bg-green-700 ml-1">TLC Activo (0%)</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 ml-1">Sin TLC (6%)</Badge>
                                        )}
                                    </Label>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 text-xs uppercase tracking-wider">
                                            <TableHead className="font-medium">Concepto</TableHead>
                                            <TableHead className="text-right font-medium">Moneda Original</TableHead>
                                            <TableHead className="text-right font-medium">USD</TableHead>
                                            <TableHead className="text-right font-medium text-slate-900 bg-slate-100/50">CLP (Aduanero)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-sm">
                                        <TableRow>
                                            <TableCell className="font-medium">Valor FOB</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(summary.totalFobUsd, currency)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.totalCifUsd - summary.totalFreightUsd - summary.totalInsuranceUsd)}</TableCell>
                                            <TableCell className="text-right font-medium bg-slate-50/30">
                                                {formatCurrency((summary.totalCifUsd - summary.totalFreightUsd - summary.totalInsuranceUsd) * (exchangeRates.customsUsd || exchangeRates.usd), 'CLP')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-muted-foreground pl-6">+ Flete</TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(summary.totalFreightUsd)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground bg-slate-50/30">
                                                {formatCurrency(summary.totalFreightUsd * (exchangeRates.customsUsd || exchangeRates.usd), 'CLP')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="text-muted-foreground pl-6">+ Seguro</TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(summary.totalInsuranceUsd)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground bg-slate-50/30">
                                                {formatCurrency(summary.totalInsuranceUsd * (exchangeRates.customsUsd || exchangeRates.usd), 'CLP')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className="bg-blue-50/50 font-medium border-t border-blue-100">
                                            <TableCell className="text-blue-900">= Valor CIF</TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right text-blue-900">{formatCurrency(summary.totalCifUsd)}</TableCell>
                                            <TableCell className="text-right text-blue-900 font-bold bg-blue-100/30">
                                                {formatCurrency(summary.totalCifClp, 'CLP')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow className={optimisticCert ? 'bg-green-50/30' : ''}>
                                            <TableCell className="pl-6 text-slate-600">
                                                + Ad Valorem (6%)
                                                {optimisticCert && <span className="ml-2 text-green-600 text-xs font-bold">EXENTO</span>}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(summary.totalAdValoremUsd)}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(summary.totalAdValorem, 'CLP')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="pl-6 text-slate-600">+ Gastos Locales</TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right text-muted-foreground">-</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.totalGlobalExpensesClp, 'CLP')}</TableCell>
                                        </TableRow>

                                        {/* Total Row */}
                                        <TableRow className="bg-slate-900 text-slate-100 font-bold hover:bg-slate-900">
                                            <TableCell>Costo Total (Base)</TableCell>
                                            <TableCell className="text-right opacity-70">-</TableCell>
                                            <TableCell className="text-right text-emerald-400">{formatCurrency(summary.totalCostClp / (exchangeRates.usd || 1), 'USD')}</TableCell>
                                            <TableCell className="text-right text-emerald-400">{formatCurrency(summary.totalCostClp, 'CLP')}</TableCell>
                                        </TableRow>
                                        <TableRow className="bg-slate-50 text-xs text-muted-foreground italic">
                                            <TableCell colSpan={4} className="text-right pt-2 pb-2">
                                                * El Costo Total incluye impuestos no recuperables y gastos locales.
                                                {optimisticCert && summary.savingsWithTlc > 0 &&
                                                    <span className="ml-2 text-green-600 font-semibold">
                                                        (Ahorro TLC: {formatCurrency(summary.savingsWithTlc, 'CLP')})
                                                    </span>
                                                }
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right col: Real vs Customs Comparison */}
                <div className="space-y-6">
                    <Card className="bg-amber-50/50 border-amber-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Comparativa: Real vs Aduana
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-xs text-amber-700 mb-1">Costo Según Aduana (TC Oficial)</div>
                                <div className="text-lg font-bold text-amber-900">
                                    {formatCurrency(
                                        (summary.totalCifClp + summary.totalAdValorem + summary.totalGlobalExpensesClp),
                                        'CLP'
                                    )}
                                </div>
                                <div className="text-[10px] text-amber-600/80">Base Oficial Calculada</div>
                            </div>

                            <div className="pt-3 border-t border-amber-200">
                                <div className="text-xs text-teal-700 mb-1 font-bold">Costo Real Pagado (TC Compra)</div>
                                <div className="text-xl font-bold text-teal-800">
                                    {formatCurrency(summary.totalCostClp, 'CLP')}
                                </div>
                                <div className="text-[10px] text-teal-600">Considera TC Real de Compra de Divisa</div>
                            </div>

                            {(summary.totalCostClp - (summary.totalCifClp + summary.totalAdValorem + summary.totalGlobalExpensesClp)) > 1000 && (
                                <div className="p-2 bg-white rounded border border-amber-200 text-xs text-amber-800">
                                    Diferencia: <span className="font-bold">{formatCurrency((summary.totalCostClp - (summary.totalCifClp + summary.totalAdValorem + summary.totalGlobalExpensesClp)), 'CLP')}</span>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pagos de Impuestos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Impuestos (Aduana) */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-1 mb-2">Impuestos (Aduana)</h4>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Ad Valorem ({optimisticCert ? '0%' : '6%'})</span>
                                    <span className="font-medium">{formatCurrency(summary.totalAdValorem, 'CLP')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">IVA Importación (19%)</span>
                                    <span className="font-medium">{formatCurrency(summary.vatOnCustomsValue, 'CLP')}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-semibold text-slate-700 text-sm">
                                    <span>Subtotal Impuestos</span>
                                    <span>{formatCurrency(summary.totalAdValorem + summary.vatOnCustomsValue, 'CLP')}</span>
                                </div>
                            </div>

                            {/* Gastos Locales */}
                            {(summary.totalGlobalExpensesClp > 0) && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-1 mb-2">Gastos Locales</h4>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Gastos Locales (Neto)</span>
                                        <span className="font-medium">{formatCurrency(summary.totalGlobalExpensesClp, 'CLP')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">IVA Gastos (19%)</span>
                                        <span className="font-medium">{formatCurrency(summary.vatOnLocalExpenses, 'CLP')}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-semibold text-slate-700 text-sm">
                                        <span>Subtotal Gastos</span>
                                        <span>{formatCurrency(summary.totalGlobalExpensesClp + summary.vatOnLocalExpenses, 'CLP')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Total Grand */}
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center font-bold text-slate-900 shadow-sm">
                                <span>Total a Pagar</span>
                                <span>{formatCurrency(summary.totalTaxes + summary.totalGlobalExpensesClp + summary.vatOnLocalExpenses, 'CLP')}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
