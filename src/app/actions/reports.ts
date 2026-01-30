'use server';

import { prisma } from '@/lib/prisma';
import { calculateShipmentCosts } from '@/lib/calculations';

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

        // Calculate totals per shipment including factor
        const shipmentSummaries = shipments.map(shipment => {
            const totalFob = shipment.items.reduce((acc, item) => acc + (item.quantity * item.unitPriceFob), 0);
            const totalCosts = shipment.costLines.reduce((acc, cost) => {
                if (cost.currency === 'USD') return acc + cost.amount;
                if (cost.currency === 'EUR') return acc + cost.amount * (shipment.exchangeRateEur || 1) / (shipment.exchangeRateUsd || 1);
                return acc + cost.amount / (shipment.exchangeRateUsd || 1); // CLP to USD
            }, 0);

            // Calculate factor using the same calculation logic
            const rates = {
                usd: shipment.exchangeRateUsd || 1,
                eur: shipment.exchangeRateEur || 1,
                gbp: shipment.exchangeRateGbp || 1,
                customsUsd: shipment.exchangeRateUsd || 1,
                customsEur: shipment.exchangeRateEur || 1,
                customsGbp: shipment.exchangeRateGbp || 1,
                purchaseUsd: shipment.purchaseRateUsd || shipment.exchangeRateUsd || 1,
                purchaseEur: shipment.purchaseRateEur || shipment.exchangeRateEur || 1,
                purchaseGbp: shipment.purchaseRateGbp || shipment.exchangeRateGbp || 1,
                crossEurToUsd: shipment.exchangeRateEurToUsd || undefined,
                crossGbpToUsd: shipment.exchangeRateGbpToUsd || undefined
            };
            const { summary } = calculateShipmentCosts(shipment.items, shipment.costLines, rates, shipment.hasOriginCert, shipment.supplier.currency || 'USD');
            const factor = totalFob > 0 ? summary.totalCostClp / totalFob : 0;

            // Use ETA as the reference date for charts, fallback to createdAt if no ETA
            const referenceDate = shipment.eta || shipment.createdAt;

            return {
                id: shipment.id,
                reference: shipment.reference,
                supplier: shipment.supplier.name,
                supplierId: shipment.supplierId,
                date: referenceDate,
                month: referenceDate.toISOString().slice(0, 7), // YYYY-MM based on ETA
                totalFob,
                totalCosts,
                totalCif: totalFob + totalCosts,
                totalCostClp: summary.totalCostClp,
                factor,
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

        // Aggregate factor by brand (supplier) for line chart
        const factorByBrand: { [key: string]: { name: string; data: { date: string; factor: number; reference: string }[]; avgFactor: number } } = {};
        shipmentSummaries.forEach(s => {
            if (!factorByBrand[s.supplier]) {
                factorByBrand[s.supplier] = { name: s.supplier, data: [], avgFactor: 0 };
            }
            factorByBrand[s.supplier].data.push({
                date: s.date.toISOString().slice(0, 10), // YYYY-MM-DD
                factor: s.factor,
                reference: s.reference
            });
        });
        // Calculate average factor per brand and sort data by date
        Object.values(factorByBrand).forEach(brand => {
            brand.data.sort((a, b) => a.date.localeCompare(b.date));
            brand.avgFactor = brand.data.length > 0
                ? brand.data.reduce((acc, d) => acc + d.factor, 0) / brand.data.length
                : 0;
        });

        // Get unique brands for selector
        const brands = Object.values(factorByBrand)
            .map(b => ({ name: b.name, count: b.data.length, avgFactor: b.avgFactor }))
            .sort((a, b) => b.count - a.count);

        return {
            success: true,
            data: {
                shipments: shipmentSummaries,
                monthly: Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)),
                bySupplier: Object.values(supplierData).sort((a, b) => b.totalCif - a.totalCif),
                factorByBrand: Object.values(factorByBrand),
                brands,
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
