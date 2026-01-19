'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileUp, AlertCircle, CheckCircle } from 'lucide-react';
import { importShipmentItems } from '@/app/actions/shipments';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CsvUploadDialogProps {
    shipmentId: string;
}

interface ParsedItem {
    sku: string;
    name: string;
    quantity: number;
    price: number;
}

export function CsvUploadDialog({ shipmentId }: CsvUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState<{ added: number; errors: string[] } | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset state
        setParsedData([]);
        setImportResult(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'ISO-8859-1', // Typical for generated CSVs (Excel style)
            delimiter: ';', // Explicitly try semicolon as typically used in Latam/ERP
            transformHeader: (h) => {
                // Normalize headers: remove accents, lowercase, trim
                return h.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .trim();
            },
            complete: (results) => {
                const items: ParsedItem[] = [];

                if (results.data.length === 0) {
                    setImportResult({ added: 0, errors: ['No se pudieron leer datos. Verifique que sea un CSV válido.'] });
                    return;
                }

                results.data.forEach((row: any) => {
                    // Map with normalized headers
                    // "codigo" (from Código), "producto", "cantidad", "precio"

                    const sku = row['codigo'] || row['code'] || row['sku'] || row['cdigo'];
                    const name = row['producto'] || row['product'] || row['descripcion'] || row['description'];
                    const quantity = row['cantidad'] || row['qty'] || row['quantity'];
                    const price = row['precio'] || row['price'] || row['fob'] || row['valor'];

                    // Clean up values (handle "397476" or "$1.000")
                    const cleanPrice = String(price || '0').replace(/[^0-9.,]/g, '').replace(',', '.');
                    const cleanQty = String(quantity || '0').replace(/[^0-9.,]/g, '');

                    if (sku && quantity) {
                        items.push({
                            sku: String(sku).trim(),
                            name: String(name || '').trim(),
                            quantity: Number(cleanQty),
                            price: Number(cleanPrice)
                        });
                    }
                });

                if (items.length === 0) {
                    setImportResult({ added: 0, errors: ['No se encontraron columnas válidas (Código, Producto, Cantidad, Precio).'] });
                }

                setParsedData(items);
            },
            error: (err) => {
                console.error('CSV Parsing Error:', err);
                setImportResult({ added: 0, errors: ['Error al leer el archivo.'] });
            }
        });
    };

    const handleImport = async () => {
        setIsUploading(true);
        try {
            const result = await importShipmentItems(shipmentId, parsedData);
            if (result.success && result.data) {
                setImportResult(result.data);
                // Clear data after success so user sees the result
                setParsedData([]);
            } else {
                setImportResult({ added: 0, errors: [result.error || 'Unknown error'] });
            }
        } catch (error) {
            setImportResult({ added: 0, errors: ['Failed to execute import request'] });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload size={16} />
                    Carga Masiva (CSV)
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Cargar Productos desde CSV</DialogTitle>
                    <DialogDescription>
                        Sube tu archivo de orden de compra. El sistema detectará automáticamente los productos.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!parsedData.length && !importResult && (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-slate-50">
                            <FileUp className="h-10 w-10 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 mb-4">Arrastra tu archivo aquí o busca en tu carpeta</p>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-teal-50 file:text-teal-700
                                  hover:file:bg-teal-100
                                "
                            />
                            <p className="text-xs text-muted-foreground mt-4">
                                Formato esperado: Codigo, Producto, Cantidad, Precio
                            </p>
                        </div>
                    )}

                    {parsedData.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Vista Previa ({parsedData.length} items)</h3>
                                <Button size="sm" variant="ghost" onClick={() => setParsedData([])} className="text-red-500 h-8">
                                    Cancelar
                                </Button>
                            </div>
                            <ScrollArea className="h-[300px] border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Producto</TableHead>
                                            <TableHead className="text-right">Cant.</TableHead>
                                            <TableHead className="text-right">Precio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{item.sku}</TableCell>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.price}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}

                    {importResult && (
                        <div className="space-y-4">
                            <Alert variant={importResult.errors.length > 0 ? "destructive" : "default"} className={importResult.errors.length === 0 ? "border-green-500 bg-green-50" : ""}>
                                {importResult.errors.length > 0 ? (
                                    <AlertCircle className="h-4 w-4" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                                <AlertTitle>
                                    {importResult.added} productos importados correctamente
                                </AlertTitle>
                                <AlertDescription>
                                    {importResult.errors.length > 0 && (
                                        <ul className="list-disc pl-4 mt-2 text-xs">
                                            {importResult.errors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                            {importResult.errors.length > 5 && <li>...y {importResult.errors.length - 5} más errores</li>}
                                        </ul>
                                    )}
                                </AlertDescription>
                            </Alert>
                            <div className="flex justify-end">
                                <Button onClick={() => setOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </div>

                {parsedData.length > 0 && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleImport} disabled={isUploading} className="bg-teal-600 hover:bg-teal-700">
                            {isUploading ? 'Importando...' : `Importar ${parsedData.length} Productos`}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
