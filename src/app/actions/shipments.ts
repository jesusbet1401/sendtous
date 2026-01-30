'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// SHIPMENT HEADER ACTIONS

export async function createShipment(data: {
    supplierId: string;
    reference: string;
    transportMethod: 'MARITIME' | 'AIR';
    origin?: string;
    destination?: string;
    etd?: Date;
    eta?: Date;
    blOrAwb?: string;
    carrier?: string;
}) {
    try {
        const existing = await prisma.shipment.findUnique({
            where: { reference: data.reference },
        });

        if (existing) {
            return { success: false, error: 'Reference number already exists.' };
        }

        const shipment = await prisma.shipment.create({
            data: {
                supplierId: data.supplierId,
                reference: data.reference,
                transportMethod: data.transportMethod,
                origin: data.origin,
                destination: data.destination,
                etd: data.etd,
                eta: data.eta,
                blOrAwb: data.blOrAwb,
                carrier: data.carrier,
                status: 'DRAFT',
                createdById: 'cm5v7x9x0000008l3f9x00000', // Placeholder
            },
        });

        revalidatePath('/shipments');
        return { success: true, data: shipment };
    } catch (error) {
        console.error('Error creating shipment:', error);
        return { success: false, error: 'Failed to create shipment header.' };
    }
}

export async function getShipments() {
    try {
        const shipments = await prisma.shipment.findMany({
            include: {
                supplier: true,
                _count: {
                    select: { items: true }
                }
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        return { success: true, data: shipments };
    } catch (error) {
        console.error('Error fetching shipments:', error);
        return { success: false, error: 'Failed to fetch shipments' };
    }
}

export async function getShipment(id: string) {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true
                    }
                },
                costLines: true, // Include cost lines
            }
        });
        return { success: true, data: shipment };
    } catch (error) {
        console.error('Error fetching shipment:', error);
        return { success: false, error: 'Failed to fetch shipment details' };
    }
}

// ITEMS ACTIONS

export async function addShipmentItem(data: {
    shipmentId: string;
    productId: string;
    quantity: number;
    unitPriceFob: number;
}) {
    try {
        const item = await prisma.shipmentItem.create({
            data: {
                shipmentId: data.shipmentId,
                productId: data.productId,
                quantity: Number(data.quantity),
                unitPriceFob: Number(data.unitPriceFob),
            },
        });

        revalidatePath(`/shipments/${data.shipmentId}`);
        return { success: true, data: item };
    } catch (error) {
        console.error('Error adding shipment item:', error);
        return { success: false, error: 'Failed to add item to shipment.' };
    }
}

export async function removeShipmentItem(itemId: string, shipmentId: string) {
    try {
        await prisma.shipmentItem.delete({
            where: { id: itemId }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting shipment item:', error);
        return { success: false, error: 'Failed to delete item.' };
    }
}

export async function getProductsBySupplier(supplierId: string) {
    try {
        const products = await prisma.product.findMany({
            where: { supplierId: supplierId },
            select: {
                id: true,
                name: true,
                sku: true,
                priceFob: true,
            }
        });
        return { success: true, data: products };
    } catch (error) {
        console.error('Error fetching supplier products:', error);
        return { success: false, error: 'Failed to fetch products.' };
    }
}

// FINANCIAL ACTIONS

export async function updateShipmentCertificate(shipmentId: string, hasCertificate: boolean) {
    try {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: { hasOriginCert: hasCertificate }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        return { success: true, data: shipment };
    } catch (error) {
        console.error('Error updating certificate status:', error);
        return { success: false, error: 'Failed to update certificate status.' };
    }
}

export async function updateShipmentExchangeRates(shipmentId: string, rates: {
    exchangeRateUsd?: number;
    exchangeRateEur?: number;
    exchangeRateGbp?: number;
    purchaseRateUsd?: number;
    purchaseRateEur?: number;
    purchaseRateGbp?: number;
    exchangeRateEurToUsd?: number;
    exchangeRateGbpToUsd?: number;
}) {
    try {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                exchangeRateUsd: rates.exchangeRateUsd ? Number(rates.exchangeRateUsd) : undefined,
                exchangeRateEur: rates.exchangeRateEur ? Number(rates.exchangeRateEur) : undefined,
                exchangeRateGbp: rates.exchangeRateGbp ? Number(rates.exchangeRateGbp) : undefined,
                purchaseRateUsd: rates.purchaseRateUsd ? Number(rates.purchaseRateUsd) : undefined,
                purchaseRateEur: rates.purchaseRateEur ? Number(rates.purchaseRateEur) : undefined,
                purchaseRateGbp: rates.purchaseRateGbp ? Number(rates.purchaseRateGbp) : undefined,
                exchangeRateEurToUsd: rates.exchangeRateEurToUsd ? Number(rates.exchangeRateEurToUsd) : undefined,
                exchangeRateGbpToUsd: rates.exchangeRateGbpToUsd ? Number(rates.exchangeRateGbpToUsd) : undefined,
            }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        return { success: true, data: shipment };
    } catch (error) {
        console.error('Error updating exchange rates:', error);
        return { success: false, error: 'Failed to update exchange rates.' };
    }
}

export async function addCostLine(data: {
    shipmentId: string;
    description: string;
    amount: number;
    currency: 'USD' | 'CLP' | 'EUR';
    category?: string;
}) {
    try {
        const cost = await prisma.costLine.create({
            data: {
                shipmentId: data.shipmentId,
                description: data.description,
                amount: Number(data.amount),
                currency: data.currency,
                category: data.category,
            }
        });
        revalidatePath(`/shipments/${data.shipmentId}`);
        return { success: true, data: cost };
    } catch (error) {
        console.error('Error adding cost line:', error);
        return { success: false, error: 'Failed to add cost line.' };
    }
}

export async function removeCostLine(costId: string, shipmentId: string) {
    try {
        await prisma.costLine.delete({
            where: { id: costId }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        return { success: true };
    } catch (error) {
        console.error('Error removing cost line:', error);
        return { success: false, error: 'Failed to remove cost line.' };
    }
}

// STATUS ACTIONS

export async function updateShipmentStatus(
    shipmentId: string,
    status: 'DRAFT' | 'IN_TRANSIT' | 'IN_CUSTOMS' | 'RELEASED' | 'DELIVERED'
) {
    try {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: { status }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        revalidatePath('/shipments');
        return { success: true, data: shipment };
    } catch (error) {
        return { success: false, error: 'Failed to update shipment status.' };
    }
}

export async function updateShipmentLogistics(shipmentId: string, data: {
    transportMethod: 'MARITIME' | 'AIR';
    etd?: Date;
    eta?: Date;
    origin?: string;
    destination?: string;
    blOrAwb?: string;
}) {
    try {
        const shipment = await prisma.shipment.update({
            where: { id: shipmentId },
            data: {
                transportMethod: data.transportMethod,
                etd: data.etd,
                eta: data.eta,
                origin: data.origin,
                destination: data.destination,
                blOrAwb: data.blOrAwb
            }
        });
        revalidatePath(`/shipments/${shipmentId}`);
        return { success: true, data: shipment };
    } catch (error) {
        return { success: false, error: 'Failed to update logistics details.' };
    }
}

export async function deleteShipment(shipmentId: string) {
    try {
        await prisma.shipment.delete({
            where: { id: shipmentId }
        });
        revalidatePath('/shipments');
        return { success: true };
    } catch (error) {
        console.error('Error deleting shipment:', error);
        return { success: false, error: 'Failed to delete shipment.' };
    }
}

// BULK IMPORT ACTION

export async function importShipmentItems(
    shipmentId: string,
    items: { sku: string; name: string; quantity: number; price: number }[]
) {
    try {
        const shipment = await prisma.shipment.findUnique({
            where: { id: shipmentId },
            include: { supplier: true }
        });

        if (!shipment) {
            return { success: false, error: 'Shipment not found' };
        }

        let addedCount = 0;
        let errors: string[] = [];

        // Process sequentially to avoid race conditions on product creation
        for (const item of items) {
            try {
                // 1. Find or Create Product
                let product = await prisma.product.findUnique({
                    where: { sku: item.sku }
                });

                if (!product) {
                    product = await prisma.product.create({
                        data: {
                            sku: item.sku,
                            name: item.name || 'Unknown Product',
                            supplierId: shipment.supplierId,
                            priceFob: item.price,
                            currency: shipment.supplier.currency || 'USD',
                        }
                    });
                }

                // 2. Add to Shipment
                await prisma.shipmentItem.create({
                    data: {
                        shipmentId: shipmentId,
                        productId: product.id,
                        quantity: Number(item.quantity),
                        unitPriceFob: Number(item.price),
                    }
                });

                addedCount++;
            } catch (err) {
                console.error(`Error importing item ${item.sku}:`, err);
                errors.push(`Failed to import SKU ${item.sku}`);
            }
        }

        revalidatePath(`/shipments/${shipmentId}`);
        return {
            success: true,
            data: { added: addedCount, errors }
        };

    } catch (error) {
        console.error('Error processing bulk import:', error);
        return { success: false, error: 'Failed to process bulk import.' };
    }
}

export async function saveShipmentCalculatedCosts(shipmentId: string, itemCosts: { itemId: string; unitCostClp: number }[]) {
    console.log(`[saveShipmentCalculatedCosts] Called for shipment ${shipmentId} with ${itemCosts.length} items.`);
    try {
        // Use a transaction to ensure all updates succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            let updatedCount = 0;
            for (const item of itemCosts) {
                // 1. Update ShipmentItem with the specific cost for this shipment
                const updatedItem = await tx.shipmentItem.update({
                    where: { id: item.itemId },
                    data: { unitCostClp: item.unitCostClp },
                    select: { productId: true } // Get product ID to update history
                });

                // 2. Update Product with the latest known landed cost
                if (updatedItem.productId) {
                    await tx.product.update({
                        where: { id: updatedItem.productId },
                        data: { lastLandedCostClp: item.unitCostClp }
                    });
                    updatedCount++;
                }
            }
            return updatedCount;
        });

        console.log(`[saveShipmentCalculatedCosts] Successfully updated ${result} products.`);
        revalidatePath(`/shipments/${shipmentId}`);
        revalidatePath('/products'); // Update products list so it shows new costs immediately
        return { success: true };
    } catch (error: any) {
        console.error('Error saving calculated costs:', error);
        return {
            success: false,
            error: `Error al guardar: ${error.message || JSON.stringify(error)}`
        };
    }
}
