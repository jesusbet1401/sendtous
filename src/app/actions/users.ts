'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UserSchema = z.object({
    name: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    role: z.enum(['ADMIN', 'USER', 'VIEWER']),
});

export async function createUser(data: { name: string; email: string; password: string; role: 'ADMIN' | 'USER' | 'VIEWER' }) {
    const validated = UserSchema.safeParse(data);

    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message };
    }

    try {
        const { name, email, password, role } = validated.data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
            }
        });

        revalidatePath('/users');
        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };

    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: 'El email ya está registrado.' };
        }
        console.error('Error creating user:', error);
        return { success: false, error: 'Error al crear usuario.' };
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: 'Error al obtener usuarios.' };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath('/users');
        return { success: true };
    } catch (error) {
        console.error('Error deleting user:', error);
        return { success: false, error: 'Error al eliminar usuario.' };
    }
}
