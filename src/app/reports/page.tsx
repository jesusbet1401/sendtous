import { getReportData } from '@/app/actions/reports';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ReportsCharts } from '@/components/reports/ReportsCharts';
import { formatCurrency } from '@/lib/utils';
import { Package, Ship, DollarSign, TrendingUp } from 'lucide-react';

export default async function ReportsPage() {
    const result = await getReportData();
    const data = result.success ? result.data : null;

    if (!data) {
        return <div className="p-8 text-center text-muted-foreground">Error cargando datos de reportes.</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">Reportes y Análisis</h1>
                <p className="text-sm text-slate-500">Visión general de tus importaciones y costos.</p>
            </div>
            <Separator />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-teal-50">
                            <Ship className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Embarques Totales</div>
                            <div className="text-2xl font-bold text-slate-800">{data.totals.totalShipments}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">Total FOB (USD)</div>
                            <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.totals.totalFob)}</div>
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
                            <div className="text-2xl font-bold text-slate-800">{formatCurrency(data.totals.totalCif)}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-teal-600 text-white border-none">
                    <CardContent className="p-4 pt-4 flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/20">
                            <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-teal-100">Costo Promedio</div>
                            <div className="text-2xl font-bold">
                                {data.totals.totalShipments > 0
                                    ? formatCurrency(data.totals.totalCif / data.totals.totalShipments)
                                    : '-'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts - Client Component */}
            <ReportsCharts
                monthlyData={data.monthly}
                supplierData={data.bySupplier}
            />

            {/* Recent Shipments Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Embarques Recientes</CardTitle>
                    <CardDescription>Últimos 10 embarques registrados.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-left p-3 font-medium text-slate-600">Referencia</th>
                                    <th className="text-left p-3 font-medium text-slate-600">Proveedor</th>
                                    <th className="text-right p-3 font-medium text-slate-600">FOB (USD)</th>
                                    <th className="text-right p-3 font-medium text-slate-600">CIF (USD)</th>
                                    <th className="text-center p-3 font-medium text-slate-600">Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.shipments.slice(0, 10).map((shipment) => (
                                    <tr key={shipment.id} className="border-t hover:bg-slate-50">
                                        <td className="p-3 font-medium">{shipment.reference}</td>
                                        <td className="p-3 text-muted-foreground">{shipment.supplier}</td>
                                        <td className="p-3 text-right">{formatCurrency(shipment.totalFob)}</td>
                                        <td className="p-3 text-right font-medium text-teal-700">{formatCurrency(shipment.totalCif)}</td>
                                        <td className="p-3 text-center text-muted-foreground">{shipment.itemCount}</td>
                                    </tr>
                                ))}
                                {data.shipments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No hay embarques registrados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
