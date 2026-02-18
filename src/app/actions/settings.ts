'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSystemConfig(key: string) {
    try {
        const config = await prisma.systemConfiguration.findUnique({
            where: { key }
        });
        return { success: true, data: config?.value || null };
    } catch (error) {
        console.error('Error fetching system config:', error);
        return { success: false, error: 'Failed to fetch configuration' };
    }
}

export async function upsertSystemConfig(key: string, value: string) {
    try {
        await prisma.systemConfiguration.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        revalidatePath('/settings/ai');
        return { success: true };
    } catch (error) {
        console.error('Error saving system config:', error);
        return { success: false, error: 'Failed to save configuration' };
    }
}
