'use client';

import { useState } from 'react';
import { addShipmentItem } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    sku: string;
    priceFob: number | null;
}

export function AddItemDialog({ shipmentId, products }: { shipmentId: string, products: Product[] }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        const data = {
            shipmentId,
            productId: formData.get('productId') as string,
            quantity: Number(formData.get('quantity')),
            unitPriceFob: Number(formData.get('unitPriceFob')),
        };

        const result = await addShipmentItem(data);

        setIsLoading(false);
        if (result.success) {
            setOpen(false);
            // Optional: Toast success
        } else {
            // Optional: Toast error
            console.error(result.error);
        }
    }

    const handleProductChange = (productId: string) => {
        const product = products.find(p => p.id === productId);
        setSelectedProduct(product || null);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Producto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Agregar Producto al Embarque</DialogTitle>
                        <DialogDescription>
                            Selecciona un producto del proveedor y define la cantidad.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="productId">Producto</Label>
                            <Select name="productId" required onValueChange={handleProductChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar producto..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.sku} - {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input id="quantity" name="quantity" type="number" min="1" required placeholder="0" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="unitPriceFob">Precio Unit. (FOB)</Label>
                                <Input
                                    id="unitPriceFob"
                                    name="unitPriceFob"
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    defaultValue={selectedProduct?.priceFob || ''}
                                    key={selectedProduct?.id} // Reset when product changes
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Agregar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
