'use client';

import { useState } from 'react';
import { addCostLine, removeCostLine } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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

export function CostLinesManager({ shipmentId, costs }: { shipmentId: string, costs: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [costToDelete, setCostToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsAdding(true);
        const formData = new FormData(event.currentTarget);

        await addCostLine({
            shipmentId,
            description: formData.get('description') as string,
            amount: Number(formData.get('amount')),
            currency: formData.get('currency') as 'USD' | 'CLP' | 'EUR',
            category: 'GENERAL' // Default for now
        });

        setIsAdding(false);
        (event.target as HTMLFormElement).reset();
    }

    const promptDelete = (id: string) => {
        setCostToDelete(id);
    };

    const confirmDelete = async () => {
        if (!costToDelete) return;

        setIsDeleting(true);
        try {
            await removeCostLine(costToDelete, shipmentId);
        } catch (error) {
            console.error('Failed to delete cost line:', error);
        } finally {
            setIsDeleting(false);
            setCostToDelete(null);
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Gastos de Importación</CardTitle>
                <CardDescription>Agrega facturas (Flete, Seguro, Aduana).</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                {/* Form to add new cost */}
                <form onSubmit={handleAdd} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                        <Input name="description" placeholder="Descripción (Ej. Flete)" required className="h-8 text-xs" />
                    </div>
                    <div className="w-24 space-y-1">
                        <Input name="amount" type="number" step="0.01" placeholder="Monto" required className="h-8 text-xs" />
                    </div>
                    <div className="w-20 space-y-1">
                        <Select name="currency" defaultValue="USD">
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="CLP">CLP</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" size="sm" className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700" disabled={isAdding}>
                        {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                </form>

                {/* List of costs */}
                <div className="border rounded-md overflow-hidden">
                    <Table>
                        <TableBody>
                            {costs.length > 0 ? (
                                costs.map((cost) => (
                                    <TableRow key={cost.id} className="hover:bg-slate-50">
                                        <TableCell className="py-2 text-xs font-medium">{cost.description}</TableCell>
                                        <TableCell className="py-2 text-xs text-right">
                                            {formatCurrency(cost.amount, cost.currency)}
                                        </TableCell>
                                        <TableCell className="py-2 w-[40px] text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                onClick={() => promptDelete(cost.id)}
                                                disabled={isDeleting && costToDelete === cost.id}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">
                                        Sin gastos registrados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <AlertDialog open={!!costToDelete} onOpenChange={(open) => !open && !isDeleting && setCostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Eliminar Gasto
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este gasto de importación?
                            Esto afectará el costo total del embarque.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
