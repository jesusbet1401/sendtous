'use server';

import { prisma } from '@/lib/prisma';

export async function getReportData() {
    try {
        // Get all shipments with their costs and items
        const shipments = await prisma.shipment.findMany({
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                },
                costLines: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate totals per shipment
        const shipmentSummaries = shipments.map(shipment => {
            const totalFob = shipment.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceFob), 0);
            const totalCosts = shipment.costLines.reduce((acc, cost) => {
                if (cost.currency === 'USD') return acc + cost.amount;
                if (cost.currency === 'EUR') return acc + cost.amount * (shipment.exchangeRateEur || 1) / (shipment.exchangeRateUsd || 1);
                return acc + cost.amount / (shipment.exchangeRateUsd || 1); // CLP to USD
            }, 0);

            return {
                id: shipment.id,
                reference: shipment.reference,
                supplier: shipment.supplier.name,
                date: shipment.createdAt,
                month: shipment.createdAt.toISOString().slice(0, 7), // YYYY-MM
                totalFob,
                totalCosts,
                totalCif: totalFob + totalCosts,
                itemCount: shipment.items.length,
                status: shipment.status
            };
        });

        // Aggregate by month
        const monthlyData: { [key: string]: { month: string; fob: number; costs: number; cif: number; count: number } } = {};
        shipmentSummaries.forEach(s => {
            if (!monthlyData[s.month]) {
                monthlyData[s.month] = { month: s.month, fob: 0, costs: 0, cif: 0, count: 0 };
            }
            monthlyData[s.month].fob += s.totalFob;
            monthlyData[s.month].costs += s.totalCosts;
            monthlyData[s.month].cif += s.totalCif;
            monthlyData[s.month].count += 1;
        });

        // Aggregate by supplier
        const supplierData: { [key: string]: { name: string; totalCif: number; count: number } } = {};
        shipmentSummaries.forEach(s => {
            if (!supplierData[s.supplier]) {
                supplierData[s.supplier] = { name: s.supplier, totalCif: 0, count: 0 };
            }
            supplierData[s.supplier].totalCif += s.totalCif;
            supplierData[s.supplier].count += 1;
        });

        return {
            success: true,
            data: {
                shipments: shipmentSummaries,
                monthly: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
                bySupplier: Object.values(supplierData).sort((a, b) => b.totalCif - a.totalCif),
                totals: {
                    totalShipments: shipments.length,
                    totalFob: shipmentSummaries.reduce((acc, s) => acc + s.totalFob, 0),
                    totalCif: shipmentSummaries.reduce((acc, s) => acc + s.totalCif, 0),
                }
            }
        };
    } catch (error) {
        console.error('Error fetching report data:', error);
        return { success: false, error: 'Failed to fetch report data' };
    }
}
