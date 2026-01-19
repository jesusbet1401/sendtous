'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
    try {
        // 1. Fetch all shipments for totals
        const allShipments = await prisma.shipment.findMany({
            include: {
                items: true,
                costLines: true,
            }
        });

        // 2. Fetch recent shipments for the table
        const recentShipments = await prisma.shipment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                supplier: true,
                items: true,
                costLines: true,
            }
        });

        // 3. Calculate Aggregates
        let totalShipments = 0;
        let totalCifUsd = 0;
        let totalCifClp = 0; // Estimated
        let inTransitCount = 0;

        // Arbitrary fallback exchange rate if missing from shipment (e.g. 950 CLP/USD)
        // Ideally we use the rate stored in the shipment
        const FALLBACK_USD_CLP = 950;

        for (const shipment of allShipments) {
            totalShipments++;

            if (shipment.status === 'IN_TRANSIT') {
                inTransitCount++;
            }

            // Calculate FOB total for items
            const fobTotal = shipment.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPriceFob), 0);

            // Calculate Costs total converted to USD
            const costsTotalUsd = shipment.costLines.reduce((sum: number, cost: any) => {
                if (cost.currency === 'USD') return sum + cost.amount;
                // Simple conversion approximation
                // If we have exchange rates in shipment, use them.
                const rateUsd = shipment.exchangeRateUsd || FALLBACK_USD_CLP;
                const rateEur = shipment.exchangeRateEur || 1.1; // fallback EUR/USD

                if (cost.currency === 'CLP') return sum + (cost.amount / rateUsd);
                if (cost.currency === 'EUR') return sum + (cost.amount * rateEur);
                return sum + cost.amount;
            }, 0);

            const cifUsd = fobTotal + costsTotalUsd;
            totalCifUsd += cifUsd;

            // Estimate CLP value
            // If shipment has rate, use it, else fallback
            const finalRate = shipment.exchangeRateUsd || FALLBACK_USD_CLP;
            totalCifClp += cifUsd * finalRate;
        }

        // 4. Format Recent Shipments
        const recentRequestsFormatted = recentShipments.map((s: any) => {
            const fobTotal = s.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPriceFob), 0);
            return {
                id: s.id,
                reference: s.reference,
                supplierName: s.supplier.name,
                amount: fobTotal, // Showing FOB amount in table or CIF? Usually FOB is the "purchase" amount
                status: s.status,
            };
        });

        return {
            totalShipments,
            totalCifUsd,
            totalCifClp,
            inTransitCount,
            recentShipments: recentRequestsFormatted
        };

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return {
            totalShipments: 0,
            totalCifUsd: 0,
            totalCifClp: 0,
            inTransitCount: 0,
            recentShipments: []
        };
    }
}
