'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Supplier, Currency } from '@prisma/client';

export type SupplierFormData = {
    name: string;
    country: string;
    currency: Currency;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
};

export async function getSuppliers() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { updatedAt: 'desc' }
        });
        return { success: true, data: suppliers };
    } catch (error) {
        return { success: false, error: 'Failed to fetch suppliers' };
    }
}

export async function getSupplierById(id: string) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id }
        });
        if (!supplier) {
            return { success: false, error: 'Supplier not found' };
        }
        return { success: true, data: supplier };
    } catch (error) {
        return { success: false, error: 'Failed to fetch supplier' };
    }
}

export async function createSupplier(data: SupplierFormData) {
    try {
        const supplier = await prisma.supplier.create({
            data: {
                ...data,
            },
        });
        revalidatePath('/suppliers');
        revalidatePath('/shipments/new');
        revalidatePath('/products/new');
        return { success: true, data: supplier };
    } catch (error) {
        console.error('Create Supplier Error:', error);
        return { success: false, error: 'Failed to create supplier' };
    }
}

export async function updateSupplier(id: string, data: Partial<SupplierFormData>) {
    try {
        const supplier = await prisma.supplier.update({
            where: { id },
            data,
        });
        revalidatePath('/suppliers');
        revalidatePath('/shipments/new');
        revalidatePath('/products/new');
        return { success: true, data: supplier };
    } catch (error) {
        return { success: false, error: 'Failed to update supplier' };
    }
}

export async function deleteSupplier(id: string) {
    try {
        const productsCount = await prisma.product.count({
            where: { supplierId: id }
        });

        if (productsCount > 0) {
            return { success: false, error: 'No se puede eliminar el proveedor porque tiene productos asociados.' };
        }

        await prisma.supplier.delete({
            where: { id }
        });
        revalidatePath('/suppliers');
        revalidatePath('/shipments/new');
        revalidatePath('/products/new');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete supplier' };
    }
}
