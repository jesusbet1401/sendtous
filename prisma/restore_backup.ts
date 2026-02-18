
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const backupPath = path.join(process.cwd(), 'backup', 'data.json');

    if (!fs.existsSync(backupPath)) {
        console.error('Backup file not found at:', backupPath);
        return;
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    console.log('Restoring data...');

    // 1. Restore Suppliers
    if (data.suppliers) {
        console.log(`Restoring ${data.suppliers.length} suppliers...`);
        for (const supplier of data.suppliers) {
            // Remove ID to let it be recreated or keep it if we want exact match. 
            // Better to keep ID to maintain relationships if possible, but upsert is safe.
            // Prisma createMany is faster but skipDuplicates might be useful.
            // Let's use upsert loop for safety with existing IDs.
            await prisma.supplier.upsert({
                where: { id: supplier.id },
                update: { ...supplier },
                create: { ...supplier },
            });
        }
    }

    // 2. Restore Products
    if (data.products) {
        console.log(`Restoring ${data.products.length} products...`);
        for (const product of data.products) {
            await prisma.product.upsert({
                where: { id: product.id },
                update: { ...product },
                create: { ...product },
            });
        }
    }

    // 3. Restore Shipments
    // 0. Get current Admin User
    const adminUser = await prisma.user.findFirst({
        where: { email: 'jesus@hifi.cl' }
    });

    if (!adminUser) {
        console.error("Admin user not found. Cannot link shipments.");
        return;
    }
    console.log(`Using Admin User: ${adminUser.email} (${adminUser.id})`);

    // 3. Restore Shipments
    if (data.shipments) {
        console.log(`Restoring ${data.shipments.length} shipments...`);
        for (const shipment of data.shipments) {
            // Replace createdById with current admin ID to fix FK constraint
            const { createdById, ...rest } = shipment;

            await prisma.shipment.upsert({
                where: { id: shipment.id },
                update: { ...rest, createdById: adminUser.id },
                create: { ...rest, createdById: adminUser.id },
            });
        }
    }

    // 4. Restore Shipment Items
    if (data.shipmentItems) {
        console.log(`Restoring ${data.shipmentItems.length} shipment items...`);
        for (const item of data.shipmentItems) {
            await prisma.shipmentItem.upsert({
                where: { id: item.id },
                update: { ...item },
                create: { ...item },
            });
        }
    }

    // 5. Restore Cost Lines
    if (data.costLines) {
        console.log(`Restoring ${data.costLines.length} cost lines...`);
        for (const item of data.costLines) {
            await prisma.costLine.upsert({
                where: { id: item.id },
                update: { ...item },
                create: { ...item },
            });
        }
    }

    console.log('Data restoration completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
