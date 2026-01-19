import Link from 'next/link';
import { getShipments } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Ship, Plane, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DeleteShipmentButton } from '@/components/shipments/DeleteShipmentButton';

export default async function ShipmentsPage() {
    const result = await getShipments();
    const shipments = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Embarques</h1>
                    <p className="text-sm text-slate-500">Gestiona tus operaciones de importación.</p>
                </div>
                <Link href="/shipments/new">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Embarque
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar referencia, proveedor..."
                                className="pl-9 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Referencia</TableHead>
                                <TableHead>Proveedor</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead>Creado</TableHead>
                                <TableHead>Fechas (ETD / ETA)</TableHead>
                                <TableHead className="text-center">Items</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipments && shipments.length > 0 ? (
                                shipments.map((shipment: any) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/shipments/${shipment.id}`} className="hover:underline text-teal-600 font-semibold">
                                                {shipment.reference}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-slate-700">{shipment.supplier.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                {shipment.transportMethod === 'MARITIME' ? <Ship size={16} /> : <Plane size={16} />}
                                                <span className="text-xs">{shipment.transportMethod === 'MARITIME' ? 'Marítimo' : 'Aéreo'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-500">
                                                {format(new Date(shipment.createdAt), 'dd/MM/yyyy')}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-slate-500">
                                                {shipment.etd && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-slate-600">ETD:</span> {format(new Date(shipment.etd), 'dd/MM/yyyy')}
                                                    </div>
                                                )}
                                                {shipment.eta && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-medium text-slate-600">ETA:</span> {format(new Date(shipment.eta), 'dd/MM/yyyy')}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-mono">
                                                {shipment._count?.items || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                                                {shipment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <DeleteShipmentButton id={shipment.id} reference={shipment.reference} />
                                                <Link href={`/shipments/${shipment.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                                        Ver Detalle
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No hay embarques registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
