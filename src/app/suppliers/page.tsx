import Link from 'next/link';
import { getSuppliers } from '@/app/actions/suppliers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Search, MapPin, Phone, Mail } from 'lucide-react';
import { DeleteSupplierButton } from '@/components/suppliers/DeleteSupplierButton';

export default async function SuppliersPage() {
    const result = await getSuppliers();
    const suppliers = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Proveedores</h1>
                    <p className="text-sm text-slate-500">Gestiona tu lista de proveedores internacionales.</p>
                </div>
                <Link href="/suppliers/new">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Proveedor
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar proveedor..."
                                className="pl-9 bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[300px]">Empresa</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Ubicación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers && suppliers.length > 0 ? (
                                suppliers.map((supplier: any) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900">{supplier.name}</span>
                                                <span className="text-xs text-slate-500 font-normal">{supplier.currency}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm text-slate-600">
                                                {supplier.contactName && <span>{supplier.contactName}</span>}
                                                {supplier.contactEmail && (
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Mail className="h-3 w-3" />
                                                        {supplier.contactEmail}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                                {supplier.country}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <DeleteSupplierButton id={supplier.id} name={supplier.name} />
                                                <Link href={`/suppliers/${supplier.id}/edit`}>
                                                    <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                                        Editar
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hay proveedores registrados.
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
