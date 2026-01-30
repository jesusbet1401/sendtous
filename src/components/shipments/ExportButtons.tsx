'use client';

import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportShipmentToExcel } from '@/lib/export';
import { calculateShipmentCosts } from '@/lib/calculations';

interface ExportButtonsProps {
    shipment: any; // Full shipment with items, costs, supplier
}

export function ExportButtons({ shipment }: ExportButtonsProps) {
    const handleExcelExport = () => {
        // Calculate costs first
        const { calculatedItems, summary } = calculateShipmentCosts(
            shipment.items,
            shipment.costLines || [],
            {
                usd: shipment.exchangeRateUsd || 0,
                eur: shipment.exchangeRateEur || 0,
                gbp: shipment.exchangeRateGbp || 0,
                customsUsd: shipment.exchangeRateUsd || 0,
                customsEur: shipment.exchangeRateEur || 0,
                customsGbp: shipment.exchangeRateGbp || 0,
                purchaseUsd: shipment.purchaseRateUsd || 0,
                purchaseEur: shipment.purchaseRateEur || 0,
                purchaseGbp: shipment.purchaseRateGbp || 0,
                crossEurToUsd: shipment.exchangeRateEurToUsd || 0,
                crossGbpToUsd: shipment.exchangeRateGbpToUsd || 0
            },
            shipment.hasOriginCert || false,
            shipment.supplier?.currency || 'USD'
        );

        const exportData = {
            reference: shipment.reference,
            supplier: shipment.supplier.name,
            items: calculatedItems.map((item: any) => ({
                sku: item.product.sku,
                name: item.product.name,
                quantity: item.quantity,
                unitPriceFob: item.unitPriceFob,
                totalFob: item.fobTotalUsd,
                unitCostClp: item.unitCostClp,
                totalCostClp: item.totalCostClp
            })),
            costs: (shipment.costLines || []).map((cost: any) => ({
                description: cost.description,
                amount: cost.amount,
                currency: cost.currency
            })),
            exchangeRates: {
                usd: shipment.exchangeRateUsd || 0,
                eur: shipment.exchangeRateEur || 0
            },
            summary: {
                totalFob: summary.totalFobUsd,
                totalCif: summary.totalCifUsd,
                totalCostClp: summary.totalCostClp
            }
        };

        exportShipmentToExcel(exportData);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcelExport} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Download className="h-4 w-4" />
                PDF / Imprimir
            </Button>
        </div>
    );
}
