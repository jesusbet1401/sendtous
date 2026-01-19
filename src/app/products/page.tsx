import Link from 'next/link';
import { getProducts } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Search, Package, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductListTable } from '@/components/products/ProductListTable';

export default async function ProductsPage() {
    const result = await getProducts();
    const products = result.success ? result.data : [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Productos</h1>
                    <p className="text-sm text-slate-500">Catálogo de productos y códigos HS.</p>
                </div>
                <Link href="/products/new">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </Link>
            </div>

            <ProductListTable initialProducts={products || []} />
        </div>
    );
}
