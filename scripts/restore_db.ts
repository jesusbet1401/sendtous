
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const backupPath = path.join(__dirname, '../backup/data.json');
    if (!fs.existsSync(backupPath)) {
        console.error('No backup file found at ' + backupPath);
        console.log('Please run backup_db.ts first (while connected to the OLD db)');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    console.log('Restoring data from backup...');

    // Order matters due to Foreign Keys!

    // 1. Users
    console.log(`Restoring ${data.users.length} users...`);
    for (const user of data.users) {
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: user,
        });
    }

    // 2. Suppliers
    console.log(`Restoring ${data.suppliers.length} suppliers...`);
    for (const supplier of data.suppliers) {
        // Dates need to be converted back to Date objects if they were stringified?
        // Prisma usually handles strings for Date fields, but let's be safe if needed.
        // Actually JSON.stringify converts dates to ISO strings, Prisma accepts them.
        await prisma.supplier.create({ data: supplier });
    }

    // 3. Products
    console.log(`Restoring ${data.products.length} products...`);
    for (const product of data.products) {
        await prisma.product.create({ data: product });
    }

    // 4. Shipments
    console.log(`Restoring ${data.shipments.length} shipments...`);
    for (const shipment of data.shipments) {
        await prisma.shipment.create({ data: shipment });
    }

    // 5. ShipmentItems
    console.log(`Restoring ${data.shipmentItems.length} shipment items...`);
    for (const item of data.shipmentItems) {
        await prisma.shipmentItem.create({ data: item });
    }

    // 6. CostLines
    console.log(`Restoring ${data.costLines.length} cost lines...`);
    for (const cost of data.costLines) {
        await prisma.costLine.create({ data: cost });
    }

    console.log('Restoration complete!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
