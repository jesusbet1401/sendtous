'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProducts } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils';
import { Search, Package, Trash2, Edit, Loader2, FileSpreadsheet } from 'lucide-react';
import { Product, Supplier } from '@prisma/client';

type ProductWithSupplier = Product & { supplier: Supplier };

interface ProductListTableProps {
    initialProducts: ProductWithSupplier[];
}

export function ProductListTable({ initialProducts }: ProductListTableProps) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithSupplier[]>(initialProducts);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Filter products based on search query
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Export to Excel
    const handleExportExcel = () => {
        const dataToExport = filteredProducts.map(p => {
            const priceFob = p.priceFob || 0;
            // Use stored landed cost if available
            const estimatedCost = p.lastLandedCostClp || 0;

            return {
                SKU: p.sku,
                Nombre: p.name,
                Proveedor: p.supplier.name,
                'HS Code': p.hsCode || '',
                'Precio FOB': priceFob,
                Moneda: p.currency || 'USD',
                'Costo Puesto (CLP)': estimatedCost,
                'Peso (kg)': p.weight || '',
                'Volumen (m3)': p.volume || ''
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
        XLSX.writeFile(workbook, "Productos_SendToUs.xlsx");
    };

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredProducts.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;

        setIsDeleting(true);
        const result = await deleteProducts(selectedIds);

        if (result.success) {
            setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            router.refresh();
        } else {
            // Handle error (could add toast notification here)
            console.error(result.error);
        }

        setIsDeleting(false);
        setShowDeleteDialog(false);
    };

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar por nombre, SKU o proveedor..."
                            className="pl-9 bg-white border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            className="bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                            Exportar Excel
                        </Button>

                        {selectedIds.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                                <span className="text-sm text-slate-500 mr-2">
                                    {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
                                </span>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar Selección
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[40px] pl-4">
                                <Checkbox
                                    checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Producto / SKU</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead className="text-right">FOB</TableHead>
                            <TableHead className="text-right font-bold text-teal-700 bg-teal-50/30">Costo Puesto (CLP)</TableHead>
                            <TableHead className="text-right">Logística</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id} className={selectedIds.includes(product.id) ? "bg-slate-50/80" : ""}>
                                    <TableCell className="pl-4">
                                        <Checkbox
                                            checked={selectedIds.includes(product.id)}
                                            onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}
                                            aria-label={`Select ${product.name}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-teal-600" />
                                                <span className="text-slate-900">{product.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-mono ml-6">{product.sku}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-600 bg-slate-50 font-normal">
                                            {product.supplier.name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm text-slate-500">
                                            {product.priceFob ? formatCurrency(product.priceFob, product.currency || 'USD') : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right bg-teal-50/30">
                                        <span className="text-sm font-bold text-teal-700">
                                            {product.lastLandedCostClp ? formatCurrency(product.lastLandedCostClp, 'CLP') : '-'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-slate-500">
                                        <div>{product.weight ? `${product.weight} kg` : '-'}</div>
                                        <div>{product.volume ? `${product.volume} m³` : '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/products/${product.id}/edit`}>
                                            <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Editar
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    {products.length === 0 ? "No hay productos registrados." : "No se encontraron productos con tu búsqueda."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará {selectedIds.length} producto{selectedIds.length !== 1 ? 's' : ''} permanentemente.
                            Esto no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteSelected();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
