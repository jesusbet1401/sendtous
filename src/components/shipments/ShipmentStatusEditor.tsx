'use client';

import { useState } from 'react';
import { updateShipmentStatus } from '@/app/actions/shipments';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
    DRAFT: { label: 'Borrador', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    IN_TRANSIT: { label: 'En Tránsito', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    IN_CUSTOMS: { label: 'En Aduana', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    RELEASED: { label: 'Liberado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    DELIVERED: { label: 'Entregado', color: 'bg-teal-100 text-teal-800 border-teal-200' },
};

type ShipmentStatus = keyof typeof STATUS_CONFIG;

export function ShipmentStatusEditor({
    shipmentId,
    currentStatus
}: {
    shipmentId: string;
    currentStatus: ShipmentStatus;
}) {
    const [status, setStatus] = useState<ShipmentStatus>(currentStatus);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleChange = async (newStatus: ShipmentStatus) => {
        if (newStatus === status) return;

        setIsUpdating(true);
        const result = await updateShipmentStatus(shipmentId, newStatus);

        if (result.success) {
            setStatus(newStatus);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        }
        setIsUpdating(false);
    };

    return (
        <div className="flex items-center gap-2">
            <Select
                value={status}
                onValueChange={(value) => handleChange(value as ShipmentStatus)}
                disabled={isUpdating}
            >
                <SelectTrigger className={`w-[160px] h-8 text-xs font-medium border ${STATUS_CONFIG[status].color}`}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${config.color.split(' ')[0]}`} />
                                {config.label}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {showSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        </div>
    );
}
