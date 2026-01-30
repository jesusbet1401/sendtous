'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { removeShipmentItem } from '@/app/actions/shipments';
import { Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { calculateShipmentCosts } from '@/lib/calculations';

// We need to pass more context to this component now
export function ShipmentItemsTable({
    items,
    shipmentId,
    currency = 'USD',
    costLines = [],
    exchangeRates = { usd: 1, eur: 0, gbp: 0 },
    hasCertificateOfOrigin = false
}: {
    items: any[],
    shipmentId: string,
    currency?: string,
    costLines?: any[],
    exchangeRates?: {
        usd: number; eur: number; gbp: number;
        customsUsd?: number; customsEur?: number; customsGbp?: number;
        purchaseUsd?: number; purchaseEur?: number; purchaseGbp?: number;
        crossEurToUsd?: number; crossGbpToUsd?: number;
    },
    hasCertificateOfOrigin?: boolean
}) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (itemId: string) => {
        if (confirm('¿Estás seguro de eliminar este item?')) {
            setIsDeleting(itemId);
            await removeShipmentItem(itemId, shipmentId);
            setIsDeleting(null);
        }
    };

    // Perform calculations on the fly
    const { calculatedItems, summary } = useMemo(() => {
        return calculateShipmentCosts(items, costLines, exchangeRates, hasCertificateOfOrigin, currency as 'USD' | 'EUR' | 'GBP' | 'CLP');
    }, [items, costLines, exchangeRates, hasCertificateOfOrigin, currency]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Producto / SKU</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Precio FOB</TableHead>
                        <TableHead className="text-right">Total FOB</TableHead>
                        {/* New Columns */}
                        <TableHead className="text-right text-teal-700 bg-teal-50/50">Costo Unit. (CLP)</TableHead>
                        <TableHead className="text-right text-teal-700 bg-teal-50/50">Total Línea (CLP)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {calculatedItems.length > 0 ? (
                        calculatedItems.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{item.product.name}</span>
                                        <span className="text-xs text-muted-foreground font-mono">{item.product.sku}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(item.unitPriceFob, currency)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-700">
                                    {formatCurrency(item.fobTotalUsd, currency)}
                                </TableCell>
                                {/* Calculated Calues */}
                                <TableCell className="text-right font-bold text-teal-700 bg-teal-50/30">
                                    {formatCurrency(item.unitCostClp, 'CLP')}
                                </TableCell>
                                <TableCell className="text-right text-teal-800 bg-teal-50/30">
                                    {formatCurrency(item.totalCostClp, 'CLP')}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(item.id)}
                                        disabled={isDeleting === item.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No hay productos en este embarque.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>

                {/* Footer Summary */}
                {calculatedItems.length > 0 && (
                    <TableFooter>
                        <TableRow className="bg-slate-50 font-medium border-t-2 border-slate-200">
                            <TableCell colSpan={3} className="text-right">Totales:</TableCell>
                            <TableCell className="text-right text-slate-800">
                                {formatCurrency(summary.totalFobUsd, currency)}
                            </TableCell>
                            <TableCell colSpan={2} className="text-right text-teal-800 text-lg">
                                {formatCurrency(summary.totalCostClp, 'CLP')}
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
}
