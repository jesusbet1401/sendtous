import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShipment, getProductsBySupplier } from '@/app/actions/shipments';
import { AddItemDialog } from '@/components/shipments/AddItemDialog';
import { CsvUploadDialog } from '@/components/shipments/CsvUploadDialog';
import { ShipmentItemsTable } from '@/components/shipments/ShipmentItemsTable';
import { ExchangeRateForm } from '@/components/shipments/ExchangeRateForm';
import { CostLinesManager } from '@/components/shipments/CostLinesManager';
import { ExportButtons } from '@/components/shipments/ExportButtons';
import { ShipmentStatusEditor } from '@/components/shipments/ShipmentStatusEditor';
import { ShipmentKPIs } from '@/components/shipments/ShipmentKPIs';
import { LogisticsEditor } from '@/components/shipments/LogisticsEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';


export default async function ShipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getShipment(id);
    const shipment = result.success ? result.data : null;

    if (!shipment) {
        notFound();
    }

    // Paranoid defaults to prevent crash
    const safeItems = Array.isArray(shipment.items) ? shipment.items : [];
    const safeCostLines = Array.isArray(shipment.costLines) ? shipment.costLines : [];
    const safeSupplier = shipment.supplier || { currency: 'USD', name: 'Unknown' };
    const safeStatus = shipment.status || 'DRAFT';

    // Fetch products for this supplier to populate the dropdown
    const productsResult = await getProductsBySupplier(shipment.supplierId);
    const availableProducts = (productsResult?.success && Array.isArray(productsResult.data)) ? productsResult.data : [];

    console.log('DEBUG: Shipment Data:', {
        id: shipment.id,
        itemsLen: shipment.items?.length,
        costLinesLen: shipment.costLines?.length,
        prodLen: availableProducts?.length
    });

    const exchangeRates = {
        usd: shipment.exchangeRateUsd || 0,
        eur: shipment.exchangeRateEur || 0,
        gbp: shipment.exchangeRateGbp || 0,
        // Legacy -> New Mappings
        customsUsd: shipment.exchangeRateUsd || 0,
        customsEur: shipment.exchangeRateEur || 0,
        customsGbp: shipment.exchangeRateGbp || 0,
        purchaseUsd: shipment.purchaseRateUsd || 0,
        purchaseEur: shipment.purchaseRateEur || 0,
        purchaseGbp: shipment.purchaseRateGbp || 0,
        crossEurToUsd: shipment.exchangeRateEurToUsd || 0,
        crossGbpToUsd: shipment.exchangeRateGbpToUsd || 0,

    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Actions - Top Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900">{shipment.reference}</h1>
                            <ShipmentStatusEditor
                                shipmentId={shipment.id}
                                currentStatus={safeStatus as any}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="font-medium text-slate-700">{safeSupplier.name}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">{shipment.id}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <ExportButtons shipment={{ ...shipment, items: safeItems, costLines: safeCostLines, supplier: safeSupplier }} />
                        <Link href="/shipments">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPIs / Summary Cards */}
                <ShipmentKPIs
                    shipmentId={shipment.id}
                    items={safeItems}
                    costLines={safeCostLines}
                    exchangeRates={exchangeRates}
                    currency={safeSupplier.currency || 'USD'}
                    hasOriginCert={shipment.hasOriginCert}
                />
            </div>

            <Separator />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items Table (Wide) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">Items del Embarque</CardTitle>
                                <CardDescription>Productos incluidos y sus costos calculados</CardDescription>
                            </div>
                            <AddItemDialog shipmentId={shipment.id} products={availableProducts as any[]} />
                        </CardHeader>
                        <CardContent className="p-0">
                            <ShipmentItemsTable
                                items={safeItems}
                                shipmentId={shipment.id}
                                currency={safeSupplier.currency || 'USD'}
                                costLines={safeCostLines}
                                exchangeRates={exchangeRates}
                                hasCertificateOfOrigin={shipment.hasOriginCert}
                            />
                        </CardContent>
                    </Card>

                    {/* Calculated Costs Detail */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CostLinesManager shipmentId={shipment.id} costs={safeCostLines} />
                        <LogisticsEditor shipment={shipment} />
                    </div>
                </div>

                {/* Right Column: Configuration & Inputs */}
                <div className="space-y-6">
                    <ExchangeRateForm shipment={shipment} />

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Subir CSV</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CsvUploadDialog shipmentId={shipment.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
