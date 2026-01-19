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

    // Fetch products for this supplier to populate the dropdown
    const productsResult = await getProductsBySupplier(shipment.supplierId);
    const availableProducts = productsResult.success ? productsResult.data : [];

    const exchangeRates = {
        usd: shipment.exchangeRateUsd || 0,
        eur: shipment.exchangeRateEur || 0,
        gbp: shipment.exchangeRateGbp || 0
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/shipments" className="no-print">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900">{shipment.reference}</h1>
                            <ShipmentStatusEditor
                                shipmentId={shipment.id}
                                currentStatus={shipment.status as any}
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Proveedor: <span className="font-medium text-slate-700">{shipment.supplier.name}</span>
                        </p>
                    </div>
                </div>
                <div className="no-print">
                    <ExportButtons shipment={shipment} />
                </div>
            </div>

            {/* KPIs Row */}
            <ShipmentKPIs
                shipmentId={shipment.id}
                items={shipment.items}
                costLines={shipment.costLines || []}
                exchangeRates={exchangeRates}
                currency={shipment.supplier.currency}
                hasOriginCert={shipment.hasOriginCert}
            />

            {/* Main Content Grid - Calculator Style */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Parameters & Costs (5 cols) */}
                <div className="lg:col-span-5 space-y-6">

                    {/* Exchange Rates - Like "Parámetros Globales" */}
                    <ExchangeRateForm shipment={shipment} />

                    {/* Logistics Details */}
                    <LogisticsEditor shipment={shipment} />

                    {/* Cost Lines */}
                    <CostLinesManager shipmentId={shipment.id} costs={shipment.costLines || []} />
                </div>

                {/* Right Column: Products Table (7 cols) */}
                <div className="lg:col-span-7">
                    <Card className="h-full min-h-[500px]">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div>
                                <CardTitle className="text-base">Productos</CardTitle>
                                <CardDescription>Detalle de la mercancía con costos calculados.</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <CsvUploadDialog shipmentId={shipment.id} />
                                <AddItemDialog shipmentId={shipment.id} products={availableProducts as any[]} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ShipmentItemsTable
                                items={shipment.items}
                                shipmentId={shipment.id}
                                currency={shipment.supplier.currency}
                                costLines={shipment.costLines}
                                exchangeRates={exchangeRates}
                                hasCertificateOfOrigin={shipment.hasOriginCert}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
