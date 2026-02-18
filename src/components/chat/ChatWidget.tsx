'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addCostLine, getShipments } from '@/app/actions/shipments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, X, Send, Bot, User, Loader2, Minus, Maximize2, Paperclip, Image as ImageIcon, Check, Plus, Package } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface ChatWidgetProps {
    context?: any; // The shipment context to send to the AI
}

export function ChatWidget({ context }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingFileRef = useRef<File | null>(null);

    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('');
    const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);

    // Initialize ID from context if available
    useEffect(() => {
        if (context?.id) {
            setActiveShipmentId(context.id);
        }
    }, [context]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const getShipmentId = () => {
        // 1. Check local state (previously selected or from context)
        if (activeShipmentId) return activeShipmentId;

        // 2. Check context prop again just in case
        if (context?.id) return context.id;

        // 3. Try to extract from URL
        if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/\/shipments\/([^\/]+)/);
            if (match && match[1]) {
                const id = match[1];
                setActiveShipmentId(id);
                return id;
            }
        }
        return null;
    };

    const executeAddExpenses = async (shipmentId: string, gastos: any[]) => {
        setIsLoading(true);
        try {
            let count = 0;
            for (const gasto of gastos) {
                await addCostLine({
                    shipmentId: shipmentId,
                    description: gasto.descripcion,
                    amount: Number(gasto.monto),
                    currency: gasto.moneda,
                    category: 'GENERAL'
                });
                count++;
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `✓ ${count} gastos agregados al embarque.`
            }]);

            // Refresh UI to show new costs
            router.refresh();

        } catch (error) {
            console.error('Error adding expenses:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '❌ Error al agregar los gastos.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectShipment = async (shipment: any, pendingExpenses: any[]) => {
        // Step 2: User selected a shipment. Ask for final confirmation.
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Agregarás ${pendingExpenses.length} gastos al embarque ${shipment.reference}.`,
            confirmationAction: {
                shipmentId: shipment.id,
                expenses: pendingExpenses
            }
        }]);
    };

    const handleConfirmExpense = async (shipmentId: string, expenses: any[]) => {
        // Step 3: Final execution after confirmation
        await executeAddExpenses(shipmentId, expenses);
    };

    // Helper to get available shipments for selection
    const fetchShipmentsForSelection = async () => {
        try {
            const result = await getShipments();
            if (result.success && result.data) {
                // Return top 5 recent shipments + maybe filtering by IN_TRANSIT could be better, 
                // but user asked for "MONITOR AUDIO 88 (Borrador), SENNHEISER 103 (En tránsito)"
                // so we pass them all (limited)
                return result.data.slice(0, 10).map(s => ({
                    id: s.id,
                    reference: s.reference,
                    supplierName: s.supplier?.name || 'Desconocido',
                    status: s.status
                }));
            }
            return [];
        } catch (err) {
            console.error('Error fetching shipments:', err);
            return [];
        }
    };

    const handleProcessProducts = async (file: File) => {
        setIsLoading(true);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⏳ Procesando factura/productos...`
        }]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/proxy/n8n/pdf-to-csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                if (response.status === 413) {
                    throw new Error('El archivo es demasiado grande para el servidor (Error 413).');
                }
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
            }

            const blob = await response.blob();
            const csvFile = new File([blob], `productos_extraidos_${Date.now()}.csv`, { type: 'text/csv' });

            const event = new CustomEvent('TRIGGER_CSV_IMPORT', { detail: csvFile });
            window.dispatchEvent(event);

            setMessages(prev => {
                const newHistory = [...prev];
                newHistory.pop(); // Remove processing msg
                return [...newHistory, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✓ Archivo procesado como productos. Revisa el modal de importación.`
                }];
            });

        } catch (error: any) {
            console.error('Upload error:', error);
            setMessages(prev => {
                const newHistory = [...prev];
                newHistory.pop();
                return [...newHistory, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `❌ Error al procesar el PDF de productos: ${error.message || 'Error desconocido'}`
                }];
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleProcessExpenses = async (file: File) => {
        setIsLoading(true);
        const isPdf = file.type === 'application/pdf';
        const endpoint = isPdf
            ? '/api/proxy/n8n/pdf-to-expenses'
            : '/api/proxy/n8n/image-to-expenses';

        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `⏳ Procesando gastos de importación...`
        }]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success || !data.gastos) {
                throw new Error('No se pudieron extraer gastos.');
            }

            const gastosList = data.gastos.map((g: any) =>
                `- ${g.descripcion}: ${formatCurrency(g.monto, g.moneda)}`
            ).join('\n');

            const shipments = await fetchShipmentsForSelection();

            setMessages(prev => {
                const newHistory = [...prev];
                newHistory.pop(); // Remove processing msg

                return [...newHistory, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✓ Se encontraron ${data.total || data.gastos.length} gastos:\n${gastosList}\n\n¿A qué embarque deseas agregar estos gastos?`,
                    shipmentSelection: shipments,
                    pendingExpenses: data.gastos
                }];
            });

        } catch (error: any) {
            console.error('Expense processing error:', error);
            setMessages(prev => {
                const newHistory = [...prev];
                newHistory.pop();
                return [...newHistory, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '❌ Error al procesar gastos.'
                }];
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePdfAction = (action: 'products' | 'expenses') => {
        const file = pendingFileRef.current;
        if (!file) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: '❌ Error: No se encontró el archivo pendiente.'
            }]);
            return;
        }

        // Hide buttons by removing pdfAction from previous messages
        setMessages(prev => prev.map(m => ({ ...m, pdfAction: undefined })));

        if (action === 'products') {
            handleProcessProducts(file);
        } else {
            handleProcessExpenses(file);
        }

        pendingFileRef.current = null;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const isPdf = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');

        if (!isPdf && !isImage) {
            alert('Solo se permiten archivos PDF o Imágenes (JPG, PNG)');
            return;
        }

        if (isPdf) {
            pendingFileRef.current = file;
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: `📎 Archivo subido: ${file.name}`
            }, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `📄 He recibido el archivo "${file.name}".\n\n¿Qué tipo de documento es?`,
                pdfAction: true
            }]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        if (isImage) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: `📷 Imagen subida: ${file.name}`
            }]);
            handleProcessExpenses(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input
        };

        // Add user message immediately
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // New n8n Integration
            const response = await fetch('/api/proxy/n8n/chat-assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('n8n Webhook Error Response:', errorText);
                throw new Error(`Failed to fetch response: ${errorText}`);
            }

            const data = await response.json();
            const assistantContent = data.response; // Use data.response as requested

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent
            };

            // Add assistant message
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Error sending message:', error);
            // Optional: Add error message to chat
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Lo siento, ocurrió un error al procesar tu mensaje.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen, isLoading]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        setIsMinimized(false);
    };

    const toggleMinimize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
        setIsOpen(true);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

            {/* Chat Window */}
            {isOpen && !isMinimized && (
                <Card className="w-[380px] h-[500px] shadow-2xl flex flex-col border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <CardHeader className="bg-slate-900 text-white p-4 rounded-t-xl flex flex-row items-center justify-between space-y-0 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-teal-500 p-1.5 rounded-full">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-medium">Asistente de Importaciones</CardTitle>
                                <p className="text-[10px] text-slate-300">Impulsado por IA</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-800" onClick={toggleMinimize}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-white hover:bg-slate-800" onClick={() => setIsOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-slate-500 mt-20 px-6">
                                <div className="bg-slate-100 p-3 rounded-full inline-block mb-3">
                                    <MessageSquare className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="text-sm">Hola, soy tu asistente de importaciones. Puedo analizar tus costos y darte recomendaciones. ¿En qué puedo ayudarte?</p>
                            </div>
                        )}

                        {messages.map(m => (
                            <div key={m.id} className={cn(
                                "flex w-full mb-2",
                                m.role === 'user' ? "justify-end" : "justify-start"
                            )}>
                                <div className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                    m.role === 'user'
                                        ? "bg-teal-600 text-white rounded-br-none"
                                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                                )}>
                                    {/* Simple Markdown rendering could be added here, currently just text */}
                                    <p className="whitespace-pre-wrap">
                                        {m.content}
                                    </p>

                                    {/* STEP 1.5: PDF Action Selection */}
                                    {m.pdfAction && (
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handlePdfAction('products')}
                                                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700"
                                            >
                                                <Package className="mr-2 h-4 w-4" />
                                                Productos/Factura
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handlePdfAction('expenses')}
                                                className="bg-amber-100 hover:bg-amber-200 text-amber-700"
                                            >
                                                <div className="mr-2 font-bold">$</div>
                                                Gastos de Importación
                                            </Button>
                                        </div>
                                    )}

                                    {/* STEP 2: Shipment Selection */}
                                    {m.shipmentSelection && (
                                        <div className="mt-3 space-y-2">
                                            {m.shipmentSelection.map((shipment: any) => (
                                                <Button
                                                    key={shipment.id}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-start text-xs h-auto py-2 hover:bg-teal-50 hover:border-teal-200"
                                                    onClick={() => handleSelectShipment(shipment, m.pendingExpenses)}
                                                >
                                                    <Package className="mr-2 h-3.5 w-3.5 text-teal-600" />
                                                    <div className="flex flex-col items-start text-left">
                                                        <span className="font-bold">{shipment.reference}</span>
                                                        <span className="text-xs text-slate-500">{shipment.supplierName}</span>
                                                    </div>
                                                </Button>
                                            ))}
                                        </div>
                                    )}

                                    {/* STEP 3: Final Confirmation */}
                                    {m.confirmationAction && (
                                        <div className="mt-3">
                                            <Button
                                                size="sm"
                                                onClick={() => handleConfirmExpense(m.confirmationAction.shipmentId, m.confirmationAction.expenses)}
                                                className="bg-teal-600 hover:bg-teal-700 text-white w-full font-bold shadow-sm"
                                                disabled={isLoading}
                                            >
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                Confirmar y Agregar
                                            </Button>
                                        </div>
                                    )}

                                    {m.attachment && m.attachment.type === 'csv' && (
                                        <div className="mt-2">
                                            <a
                                                href={m.attachment.url}
                                                download={m.attachment.filename}
                                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <Paperclip className="h-4 w-4" />
                                                Descargar CSV
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="bg-slate-100 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                    <span className="text-xs text-slate-400">Escribiendo...</span>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="p-3 bg-slate-50 border-t rounded-b-xl shrink-0">
                        <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="application/pdf,image/png,image/jpeg,image/jpg"
                                multiple
                                onChange={handleFileUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 text-slate-500 hover:text-teal-600"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>

                            <Input
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Escribe tu consulta..."
                                className="flex-1 focus-visible:ring-teal-500 border-slate-200 bg-white"
                                disabled={isLoading}
                                autoFocus
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-teal-600 hover:bg-teal-700 shrink-0">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Minimized State (Just a bubble but maybe keeping state?) or just the FAB */}

            {/* Floating Action Button */}
            {!isOpen && (
                <Button
                    onClick={toggleOpen}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700 text-white p-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
                >
                    <MessageSquare className="h-7 w-7" />
                    <span className="sr-only">Abrir Chat</span>
                </Button>
            )}

            {/* Minimized Bubble (Different look if active conversation?) */}
            {isOpen && isMinimized && (
                <Button
                    onClick={() => setIsMinimized(false)}
                    size="lg"
                    className="h-14 w-14 rounded-full shadow-lg bg-slate-900 hover:bg-slate-800 text-white p-0 flex items-center justify-center transition-all duration-300 hover:scale-105"
                >
                    <div className="relative">
                        <Bot className="h-7 w-7" />
                        {messages.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                        )}
                    </div>
                </Button>
            )}
        </div>
    );
}
