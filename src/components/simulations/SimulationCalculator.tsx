'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, RefreshCw, Calculator, FileCheck, AlertTriangle, TrendingDown, FileSpreadsheet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateShipmentCosts } from '@/lib/calculations';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Mock types compliant with our calculation engine
interface MockItem {
    id: string; // temp id
    productId: string; // dummy
    quantity: number;
    unitPriceFob: number;
    // Calculation result placeholders (will be filled by logic)
    product: { name: string; sku: string };
    [key: string]: any;
}

interface MockCost {
    id: string;
    description: string;
    amount: number;
    currency: 'USD' | 'CLP' | 'EUR';
    category?: string;
}

export function SimulationCalculator() {
    // STATE
    const [exchangeRates, setExchangeRates] = useState({ usd: 950, eur: 1020, gbp: 1200 }); // Default values
    const [items, setItems] = useState<MockItem[]>([]);
    const [costs, setCosts] = useState<MockCost[]>([
        { id: '1', description: 'Flete Estimado', amount: 2000, currency: 'USD', category: 'FREIGHT' },
        { id: '2', description: 'Seguro', amount: 50, currency: 'USD', category: 'INSURANCE' }
    ]);
    const [hasCertificateOfOrigin, setHasCertificateOfOrigin] = useState(false);

    // Temp inputs
    const [newItem, setNewItem] = useState({ name: '', price: '', qty: '' });

    // ACTIONS
    const addItem = () => {
        if (!newItem.name || !newItem.price || !newItem.qty) return;
        const item: MockItem = {
            id: Math.random().toString(36).substr(2, 9),
            productId: 'temp',
            quantity: Number(newItem.qty),
            unitPriceFob: Number(newItem.price),
            product: { name: newItem.name, sku: 'SIM-' + Math.floor(Math.random() * 1000) }
        };
        setItems([...items, item]);
        setNewItem({ name: '', price: '', qty: '' });
    };

    const addCost = () => { // Simple logic for demo, maybe add form later
        const cost: MockCost = {
            id: Math.random().toString(36).substr(2, 9),
            description: 'Gasto Extra',
            amount: 100000,
            currency: 'CLP',
            category: 'GENERAL'
        };
        setCosts([...costs, cost]);
    };

    const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
    const removeCost = (id: string) => setCosts(costs.filter(c => c.id !== id));

    // CALCULATION
    const { calculatedItems, summary } = useMemo(() => {
        // Cast to any because our Mock types technically miss some DB fields that logic might expect but doesn't strictly use for math
        return calculateShipmentCosts(items as any, costs as any, exchangeRates, hasCertificateOfOrigin);
    }, [items, costs, exchangeRates, hasCertificateOfOrigin]);

    // EXPORT TO EXCEL
    const handleExportExcel = () => {
        if (items.length === 0) return;

        // 1. Prepare Summary Data
        const summaryData = [
            ['Resumen de Simulación de Importación'],
            ['Fecha', new Date().toLocaleDateString()],
            [''],
            ['PARÁMETROS'],
            ['Dólar (CLP)', exchangeRates.usd],
            ['Euro (CLP)', exchangeRates.eur],
            ['TLC Activo', hasCertificateOfOrigin ? 'SI' : 'NO'],
            [''],
            ['TOTALES'],
            ['Total FOB (USD)', summary.totalFobUsd],
            ['Flete (USD)', summary.totalFreightUsd],
            ['Seguro (USD)', summary.totalInsuranceUsd],
            ['Total CIF (USD)', summary.totalCifUsd],
            ['Total CIF (CLP)', summary.totalCifClp],
            [''],
            ['IMPUESTOS'],
            ['Ad Valorem', summary.totalAdValorem],
            ['IVA', summary.totalVat],
            ['Total Impuestos (CLP)', summary.totalTaxes],
            [''],
            ['COSTO FINAL'],
            ['Costo Total Importación (CLP)', summary.totalCostClp],
            ['Factor de Cambio (CLP/USD)', summary.totalFobUsd > 0 ? (summary.totalCostClp / summary.totalFobUsd).toFixed(2) : 0],
        ];

        // 2. Prepare Details Data
        const detailsHeader = ['Producto', 'SKU', 'Cantidad', 'FOB Unit (USD)', 'FOB Total (USD)', 'CIF Prorrateado (USD)', 'Impuestos (CLP)', 'Costo Unitario Final (CLP)'];
        const detailsData = calculatedItems.map(item => [
            item.product.name,
            item.product.sku,
            item.quantity,
            item.unitPriceFob,
            item.quantity * item.unitPriceFob,
            item.cifTotalUsd,
            item.totalTaxes,
            item.unitCostClp
        ]);

        // 3. Create Workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Resumen
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

        // Sheet 2: Detalle
        const wsDetails = XLSX.utils.aoa_to_sheet([detailsHeader, ...detailsData]);
        XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Productos");

        // 4. Save File
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `Simulacion_Importacion_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* INPUT PANEL */}
            <div className="lg:col-span-5 space-y-6">

                {/* 1. Global Parameters */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-teal-600" />
                            Parámetros Globales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">TC Dólar (CLP)</Label>
                            <Input
                                type="number"
                                value={exchangeRates.usd}
                                onChange={e => setExchangeRates({ ...exchangeRates, usd: Number(e.target.value) })}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">TC Euro (CLP)</Label>
                            <Input
                                type="number"
                                value={exchangeRates.eur}
                                onChange={e => setExchangeRates({ ...exchangeRates, eur: Number(e.target.value) })}
                                className="h-9"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Certificate of Origin Toggle */}
                <Card className={hasCertificateOfOrigin ? 'border-green-300 bg-green-50/50' : 'border-orange-200 bg-orange-50/30'}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {hasCertificateOfOrigin ? (
                                    <div className="p-2 rounded-lg bg-green-100">
                                        <FileCheck className="h-5 w-5 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="p-2 rounded-lg bg-orange-100">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="certificate-toggle" className="text-sm font-medium cursor-pointer">
                                        ¿Tiene Certificado de Origen?
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {hasCertificateOfOrigin
                                            ? 'Exento de Ad Valorem por TLC'
                                            : 'Se aplicará 6% sobre valor CIF'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {hasCertificateOfOrigin ? (
                                    <Badge className="bg-green-600 hover:bg-green-700">
                                        TLC Activo - 0% Arancel
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                                        Sin TLC - 6% Ad Valorem
                                    </Badge>
                                )}
                                <Switch
                                    id="certificate-toggle"
                                    checked={hasCertificateOfOrigin}
                                    onCheckedChange={setHasCertificateOfOrigin}
                                />
                            </div>
                        </div>
                        {!hasCertificateOfOrigin && summary.savingsWithTlc > 0 && (
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

                {/* 3. Add Products */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Productos a Simular</CardTitle>
                        <CardDescription>Agrega items para ver su costo prorrateado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-6 gap-2 items-end">
                            <div className="col-span-3 space-y-1">
                                <Input
                                    placeholder="Nombre Producto..."
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="col-span-1 space-y-1">
                                <Input
                                    placeholder="Cant."
                                    type="number"
                                    value={newItem.qty}
                                    onChange={e => setNewItem({ ...newItem, qty: e.target.value })}
                                    className="h-8 text-sm px-2"
                                />
                            </div>
                            <div className="col-span-2 space-y-1 flex gap-2">
                                <Input
                                    placeholder="FOB (USD)"
                                    type="number"
                                    value={newItem.price}
                                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                    className="h-8 text-sm"
                                />
                                <Button size="sm" onClick={addItem} className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 shrink-0">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Mini List */}
                        <div className="border rounded-md max-h-[200px] overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="py-2 text-xs font-medium">{item.product.name}</TableCell>
                                            <TableCell className="py-2 text-xs text-right">{item.quantity} u.</TableCell>
                                            <TableCell className="py-2 text-xs text-right text-muted-foreground">
                                                {formatCurrency(item.unitPriceFob * item.quantity)}
                                            </TableCell>
                                            <TableCell className="py-2 w-[30px]">
                                                <Trash2
                                                    className="h-3 w-3 text-slate-400 cursor-pointer hover:text-red-500"
                                                    onClick={() => removeItem(item.id)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {items.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">Agrega productos arriba</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Costs */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Gastos Estimados</CardTitle>
                        <Button variant="ghost" size="sm" onClick={addCost} className="h-6 text-xs text-teal-600">
                            + Fijo (Ejemplo)
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableBody>
                                    {costs.map((cost) => (
                                        <TableRow key={cost.id} className="hover:bg-slate-50">
                                            <TableCell className="py-2 text-xs font-medium">
                                                <Input
                                                    defaultValue={cost.description}
                                                    className="h-6 text-xs border-transparent focus-visible:ring-0 p-0"
                                                    onChange={(e) => {
                                                        const newCosts = [...costs];
                                                        const idx = newCosts.findIndex(c => c.id === cost.id);
                                                        if (idx >= 0) newCosts[idx].description = e.target.value;
                                                        setCosts(newCosts);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="py-2 text-xs text-right w-[150px]">
                                                <div className="flex items-center justify-end gap-1">
                                                    <select
                                                        className="h-6 text-[10px] bg-transparent border-none focus:ring-0 text-muted-foreground font-medium cursor-pointer outline-none"
                                                        value={cost.currency}
                                                        onChange={(e) => {
                                                            const newCosts = [...costs];
                                                            const idx = newCosts.findIndex(c => c.id === cost.id);
                                                            if (idx >= 0) newCosts[idx].currency = e.target.value as any;
                                                            setCosts(newCosts);
                                                        }}
                                                    >
                                                        <option value="USD">USD</option>
                                                        <option value="CLP">CLP</option>
                                                        <option value="EUR">EUR</option>
                                                    </select>
                                                    <Input
                                                        type="number"
                                                        value={cost.amount}
                                                        className="h-6 text-xs w-20 text-right p-0 border-slate-200"
                                                        onChange={(e) => {
                                                            const newCosts = [...costs];
                                                            const idx = newCosts.findIndex(c => c.id === cost.id);
                                                            if (idx >= 0) newCosts[idx].amount = Number(e.target.value);
                                                            setCosts(newCosts);
                                                        }}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2 w-[30px] text-right">
                                                <Trash2 className="h-3 w-3 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => removeCost(cost.id)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* RESULTS PANEL */}
            <div className="lg:col-span-7 space-y-6">

                {/* Summary KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <div className="text-xs text-muted-foreground mb-1">Total FOB (USD)</div>
                            <div className="text-xl font-bold text-slate-700">{formatCurrency(summary.totalFobUsd)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 pt-4">
                            <div className="text-xs text-muted-foreground mb-1">Total CIF (USD)</div>
                            <div className="text-xl font-bold text-slate-700">{formatCurrency(summary.totalCifUsd)}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 border-teal-200">
                        <CardContent className="p-4 pt-4">
                            <div className="text-xs text-teal-800 mb-1 font-medium">Factor (CLP/USD)</div>
                            <div className="text-xl font-bold text-teal-700">
                                {summary.totalFobUsd > 0 ? (summary.totalCostClp / summary.totalFobUsd).toFixed(2) : '-'}
                            </div>
                            <div className="text-[10px] text-teal-600">1 USD FOB = X CLP Puesto</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-teal-600 text-white border-none shadow-md">
                        <CardContent className="p-4 pt-4">
                            <div className="text-xs text-teal-100 mb-1">Costo Total (CLP)</div>
                            <div className="text-xl font-bold">{formatCurrency(summary.totalCostClp, 'CLP')}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tax Summary Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Resumen de Impuestos</CardTitle>
                            {hasCertificateOfOrigin ? (
                                <Badge className="bg-green-600">TLC Activo</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700">Sin TLC</Badge>
                            )}
                        </div>
                        <CardDescription>Desglose según normativa chilena (CIF → Ad Valorem → IVA)</CardDescription>
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
                                    <TableRow className={hasCertificateOfOrigin ? 'bg-green-50/50' : ''}>
                                        <TableCell className="text-sm">
                                            Ad Valorem (6%)
                                            {hasCertificateOfOrigin && <span className="ml-2 text-green-600 text-xs">Exento</span>}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {hasCertificateOfOrigin ? (
                                                <span className="text-green-600">$0.00</span>
                                            ) : (
                                                formatCurrency(summary.totalAdValorem / exchangeRates.usd)
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {hasCertificateOfOrigin ? (
                                                <span className="text-green-600">CLP 0</span>
                                            ) : (
                                                formatCurrency(summary.totalAdValorem, 'CLP')
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow className="bg-amber-50/50 font-medium">
                                        <TableCell className="text-sm">= Valor Aduanero</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(summary.totalCustomsValue / exchangeRates.usd)}</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(summary.totalCustomsValue, 'CLP')}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="text-sm">IVA (19%)</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(summary.totalVat / exchangeRates.usd)}</TableCell>
                                        <TableCell className="text-right text-sm">{formatCurrency(summary.totalVat, 'CLP')}</TableCell>
                                    </TableRow>
                                    <TableRow className="bg-teal-50 font-bold border-t-2 border-teal-200">
                                        <TableCell className="text-sm text-teal-800">Total Impuestos</TableCell>
                                        <TableCell className="text-right text-sm text-teal-800">{formatCurrency(summary.totalTaxes / exchangeRates.usd)}</TableCell>
                                        <TableCell className="text-right text-sm text-teal-800">{formatCurrency(summary.totalTaxes, 'CLP')}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Result Table */}
                <Card className="h-full min-h-[300px]">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Resultado Detallado</CardTitle>
                                <CardDescription>Costo Unitario calculado para cada producto simulado.</CardDescription>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 text-teal-700 hover:text-teal-800 hover:bg-teal-50"
                                onClick={handleExportExcel}
                                disabled={items.length === 0}
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Exportar Excel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50">
                                    <TableHead>Producto</TableHead>
                                    <TableHead className="text-right">FOB Unit.</TableHead>
                                    <TableHead className="text-right">CIF Total</TableHead>
                                    <TableHead className="text-right">Impuestos</TableHead>
                                    <TableHead className="text-right font-bold text-teal-700">Costo Unit. CLP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calculatedItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.product.name}</TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {formatCurrency(item.unitPriceFob)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {formatCurrency(item.cifTotalUsd)}
                                        </TableCell>
                                        <TableCell className="text-right text-xs">
                                            {formatCurrency(item.totalTaxes, 'CLP')}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-teal-700 bg-teal-50/30">
                                            {formatCurrency(item.unitCostClp, 'CLP')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {calculatedItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Agrega productos y ajusta gastos para visualizar resultados.<br />
                                            El cálculo es automático.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}
