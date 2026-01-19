'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    supplierId: string;
    hsCode?: string;
    weight?: number;
    volume?: number;
    priceFob?: number;
    currency?: 'USD' | 'EUR' | 'GBP' | 'CLP';
}) {
    try {
        // Sanitize optional fields - convert empty strings to undefined
        const sanitizedData = {
            name: data.name,
            sku: data.sku,
            description: data.description || undefined,
            supplierId: data.supplierId,
            hsCode: data.hsCode || undefined,
            weight: data.weight ? Number(data.weight) : undefined,
            volume: data.volume ? Number(data.volume) : undefined,
            priceFob: data.priceFob ? Number(data.priceFob) : undefined,
            currency: data.currency || undefined,
        };

        const product = await prisma.product.create({
            data: sanitizedData,
        });

        revalidatePath('/products');
        return { success: true, data: product };
    } catch (error: unknown) {
        console.error('Error creating product:', error);

        // Get actual error message
        let errorMessage = 'Failed to create product.';
        if (error instanceof Error) {
            // Check for specific Prisma errors
            if (error.message.includes('Unique constraint')) {
                errorMessage = 'El SKU ya existe. Por favor usa un código único.';
            } else if (error.message.includes('Foreign key constraint')) {
                errorMessage = 'El proveedor seleccionado no es válido.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
        }

        return { success: false, error: errorMessage };
    }
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            include: {
                supplier: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        return { success: true, data: products };
    } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: 'Failed to fetch products' };
    }
}

export async function getSuppliersForSelect() {
    try {
        const suppliers = await prisma.supplier.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            }
        });
        return { success: true, data: suppliers };
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        return { success: false, error: 'Failed to fetch suppliers' };
    }
}

export async function getProduct(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        return { success: true, data: product };
    } catch (error) {
        console.error('Error fetching product:', error);
        return { success: false, error: 'Failed to fetch product' };
    }
}

export async function updateProduct(id: string, data: {
    name: string;
    sku: string;
    description?: string;
    supplierId: string;
    hsCode?: string;
    weight?: number;
    volume?: number;
    priceFob?: number;
    currency?: 'USD' | 'EUR' | 'GBP' | 'CLP';
}) {
    try {
        const sanitizedData = {
            name: data.name,
            sku: data.sku,
            description: data.description || undefined,
            supplierId: data.supplierId,
            hsCode: data.hsCode || undefined,
            weight: data.weight ? Number(data.weight) : (data.weight === 0 ? 0 : undefined),
            volume: data.volume ? Number(data.volume) : (data.volume === 0 ? 0 : undefined),
            priceFob: data.priceFob ? Number(data.priceFob) : (data.priceFob === 0 ? 0 : undefined),
            currency: data.currency || undefined,
        };

        const product = await prisma.product.update({
            where: { id },
            data: sanitizedData,
        });

        revalidatePath('/products');
        return { success: true, data: product };
    } catch (error: unknown) {
        console.error('Error updating product:', error);
        let errorMessage = 'Failed to update product.';
        if (error instanceof Error) {
            if (error.message.includes('Unique constraint')) {
                errorMessage = 'El SKU ya existe. Por favor usa un código único.';
            } else {
                errorMessage = `Error: ${error.message}`;
            }
        }
        return { success: false, error: errorMessage };
    }
}

export async function deleteProducts(ids: string[]) {
    try {
        await prisma.product.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        console.error('Error deleting products:', error);
        return { success: false, error: 'Failed to delete products' };
    }
}
