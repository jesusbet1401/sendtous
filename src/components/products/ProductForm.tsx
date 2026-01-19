'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct, updateProduct } from '@/app/actions/products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Product } from '@prisma/client';

interface Supplier {
    id: string;
    name: string;
}

interface ProductFormProps {
    suppliers: Supplier[];
    product?: Product; // existing product for editing
}

export function ProductForm({ suppliers, product }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!product;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            name: formData.get('name') as string,
            sku: formData.get('sku') as string,
            description: formData.get('description') as string,
            supplierId: formData.get('supplierId') as string,
            hsCode: formData.get('hsCode') as string,
            weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
            volume: formData.get('volume') ? Number(formData.get('volume')) : undefined,
            priceFob: formData.get('priceFob') ? Number(formData.get('priceFob')) : undefined,
            currency: formData.get('currency') as 'USD' | 'EUR' | 'GBP' | 'CLP' | undefined,
        };

        let result;
        if (isEditing && product) {
            result = await updateProduct(product.id, data);
        } else {
            result = await createProduct(data);
        }

        if (result.success) {
            router.push('/products');
            router.refresh(); // Ensure list is updated
        } else {
            setError(result.error as string);
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/products">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                </h1>
            </div>

            <Card className="max-w-[600px] mx-auto shadow-sm">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>{isEditing ? 'Editar Detalles' : 'Detalles del Producto'}</CardTitle>
                        <CardDescription>
                            {isEditing ? 'Modifica la información del producto.' : 'Registra un nuevo producto en el catálogo.'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="sku">SKU / Código <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="sku"
                                        name="sku"
                                        defaultValue={product?.sku}
                                        placeholder="Ej. WH-1000XM5"
                                        required
                                        autoFocus={!isEditing}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="supplierId">Proveedor <span className="text-destructive">*</span></Label>
                                    <Select name="supplierId" defaultValue={product?.supplierId} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre del Producto <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={product?.name}
                                    placeholder="Ej. Audífonos Sony Noise Cancelling"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    defaultValue={product?.description || ''}
                                    placeholder="Detalles técnicos..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="hsCode">HS Code</Label>
                                    <Input
                                        id="hsCode"
                                        name="hsCode"
                                        defaultValue={product?.hsCode || ''}
                                        placeholder="8518.30.00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="weight">Peso (kg)</Label>
                                    <Input
                                        id="weight"
                                        name="weight"
                                        type="number"
                                        step="0.01"
                                        defaultValue={product?.weight || ''}
                                        placeholder="0.25"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="volume">Volumen (m³)</Label>
                                    <Input
                                        id="volume"
                                        name="volume"
                                        type="number"
                                        step="0.001"
                                        defaultValue={product?.volume || ''}
                                        placeholder="0.002"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                <div className="grid gap-2">
                                    <Label htmlFor="priceFob">Precio Base (FOB) <span className="text-muted-foreground text-xs font-normal">(Opcional)</span></Label>
                                    <Input
                                        id="priceFob"
                                        name="priceFob"
                                        type="number"
                                        step="0.01"
                                        defaultValue={product?.priceFob || ''}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Moneda Base</Label>
                                    <Select name="currency" defaultValue={product?.currency || 'USD'}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD - Dólar</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                            <SelectItem value="GBP">GBP - Libra</SelectItem>
                                            <SelectItem value="CLP">CLP - Peso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                    </CardContent>

                    <CardFooter className="flex justify-end gap-3 border-t bg-muted/50 px-6 py-4">
                        <Link href="/products">
                            <Button variant="outline" type="button">Cancelar</Button>
                        </Link>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar Cambios' : 'Guardar Producto'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
