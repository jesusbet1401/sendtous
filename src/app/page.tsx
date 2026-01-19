import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, ArrowUpRight, Ship, DollarSign, Package, Calendar, Filter, Share } from 'lucide-react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { formatCurrency } from '@/lib/utils'; // Assuming this utility exists, otherwise I'll need to check or inline

// Helpers for numeric formatting if utils missing
const formatMoney = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
};

export default async function Home() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Resumen de operaciones y costos de importación</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Buttons kept as UI placeholders for now */}
          <Button variant="outline" size="sm" className="h-9 text-xs bg-white">
            <Calendar size={14} className="mr-2 text-slate-500" />
            Ultimos 30 días
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs bg-white">
            <Filter size={14} className="mr-2 text-slate-500" />
            Filtros
          </Button>
          <Button size="sm" className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
            <Share size={14} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-slate-100">
          <CardContent className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Ship size={20} strokeWidth={2} />
              </div>
              {/* Trends are hard to calculate without historical data, keeping static or hiding */}
              {/* <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100">
                +12%
              </Badge> */}
            </div>
            <div>
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Total Embarques</h3>
              <p className="text-3xl font-bold text-slate-800">{stats.totalShipments}</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2 */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-slate-100">
          <CardContent className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <DollarSign size={20} strokeWidth={2} />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Valor Importado (USD)</h3>
              <p className="text-3xl font-bold text-slate-800">{formatMoney(stats.totalCifUsd, 'USD')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3 */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-slate-100">
          <CardContent className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <DollarSign size={20} strokeWidth={2} />
              </div>
              <span className="text-xs text-slate-400 font-medium">CLP (Est)</span>
            </div>
            <div>
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">Valor Importado (CLP)</h3>
              {/* Using compact notation for large CLP numbers */}
              <p className="text-3xl font-bold text-slate-800" title={formatMoney(stats.totalCifClp, 'CLP')}>
                {new Intl.NumberFormat('es-CL', { notation: 'compact', style: 'currency', currency: 'CLP' }).format(stats.totalCifClp)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4 */}
        <Card className="hover:shadow-lg transition-shadow duration-200 border-slate-100">
          <CardContent className="p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Package size={20} strokeWidth={2} />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-1">En Tránsito</h3>
              <p className="text-3xl font-bold text-slate-800">{stats.inTransitCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section - Keeping placeholder for now as requested only data connection */}
        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Evolución de Costos</CardTitle>
            <select className="text-xs border-none bg-slate-50 rounded-md px-2 py-1 text-slate-600 focus:ring-0">
              <option>Últimos 6 meses</option>
              <option>Este año</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm mt-4">
              Gráfico de Evolución (Próximamente)
            </div>
          </CardContent>
        </Card>

        {/* Recent Shipments Table */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
            <CardTitle className="text-base font-semibold text-slate-800">Embarques Recientes</CardTitle>
            <Button variant="link" className="text-teal-600 h-auto p-0 text-xs">Ver todos</Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 text-slate-500">
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-wider font-medium">Referencia</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-medium">Proveedor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-medium text-right">Monto (FOB)</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-medium text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentShipments.length > 0 ? (
                  stats.recentShipments.map((shipment: any) => (
                    <TableRow key={shipment.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-700">{shipment.reference}</TableCell>
                      <TableCell className="text-slate-600">{shipment.supplierName}</TableCell>
                      <TableCell className="text-right font-medium text-slate-700">{formatMoney(shipment.amount, 'USD')}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-none">
                          {shipment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No hay embarques recientes registrados.
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
