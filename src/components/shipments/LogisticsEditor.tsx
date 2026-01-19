'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Ship, Plane, Calendar, MapPin, FileText, Pencil, X, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { updateShipmentLogistics } from '@/app/actions/shipments';

interface LogisticsEditorProps {
    shipment: any; // Using any for simplicity as per existing pattern, ideally strict type
}

export function LogisticsEditor({ shipment }: LogisticsEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        transportMethod: shipment.transportMethod,
        etd: shipment.etd ? new Date(shipment.etd).toISOString().split('T')[0] : '',
        eta: shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        blOrAwb: shipment.blOrAwb || ''
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateShipmentLogistics(shipment.id, {
                transportMethod: formData.transportMethod as 'MARITIME' | 'AIR',
                etd: formData.etd ? new Date(formData.etd) : undefined,
                eta: formData.eta ? new Date(formData.eta) : undefined,
                origin: formData.origin,
                destination: formData.destination,
                blOrAwb: formData.blOrAwb
            });

            if (result.success) {
                setIsEditing(false);
            } else {
                alert('Error al guardar: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form data to current props
        setFormData({
            transportMethod: shipment.transportMethod,
            etd: shipment.etd ? new Date(shipment.etd).toISOString().split('T')[0] : '',
            eta: shipment.eta ? new Date(shipment.eta).toISOString().split('T')[0] : '',
            origin: shipment.origin || '',
            destination: shipment.destination || '',
            blOrAwb: shipment.blOrAwb || ''
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Editar Logística</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving} className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700">
                            <X className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 w-8 p-0 bg-teal-600 hover:bg-teal-700 text-white">
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs">Método de Transporte</Label>
                        <Select
                            value={formData.transportMethod}
                            onValueChange={(val) => setFormData({ ...formData, transportMethod: val })}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MARITIME">Marítimo</SelectItem>
                                <SelectItem value="AIR">Aéreo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs">ETD</Label>
                            <Input
                                type="date"
                                className="h-8 text-xs"
                                value={formData.etd}
                                onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">ETA</Label>
                            <Input
                                type="date"
                                className="h-8 text-xs"
                                value={formData.eta}
                                onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-xs">Origen</Label>
                            <Input
                                className="h-8 text-xs"
                                value={formData.origin}
                                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Destino</Label>
                            <Input
                                className="h-8 text-xs"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs">BL / AWB</Label>
                        <Input
                            className="h-8 text-xs font-mono"
                            value={formData.blOrAwb}
                            onChange={(e) => setFormData({ ...formData, blOrAwb: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Read-only View (Original Card Content with Edit Button)
    return (
        <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Logística</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-6 w-6 p-0 text-slate-400 hover:text-teal-600 no-print">
                    <Pencil className="h-3 w-3" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                        {shipment.transportMethod === 'MARITIME' ? <Ship size={14} /> : <Plane size={14} />}
                        Método
                    </span>
                    <span className="font-medium">{shipment.transportMethod === 'MARITIME' ? 'Marítimo' : 'Aéreo'}</span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <div>
                            <div className="text-[10px] text-muted-foreground">ETD</div>
                            <div className="text-xs font-medium">{shipment.etd ? format(new Date(shipment.etd), 'dd/MM/yyyy') : '-'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <div>
                            <div className="text-[10px] text-muted-foreground">ETA</div>
                            <div className="text-xs font-medium">{shipment.eta ? format(new Date(shipment.eta), 'dd/MM/yyyy') : '-'}</div>
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <div>
                            <div className="text-[10px] text-muted-foreground">Origen</div>
                            <div className="text-xs font-medium">{shipment.origin || '-'}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        <div>
                            <div className="text-[10px] text-muted-foreground">Destino</div>
                            <div className="text-xs font-medium">{shipment.destination || '-'}</div>
                        </div>
                    </div>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <div>
                        <div className="text-[10px] text-muted-foreground">BL / AWB</div>
                        <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{shipment.blOrAwb || 'N/A'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
