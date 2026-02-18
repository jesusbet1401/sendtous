
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting backup...');

    const data = {
        users: await prisma.user.findMany(),
        suppliers: await prisma.supplier.findMany(),
        products: await prisma.product.findMany(),
        shipments: await prisma.shipment.findMany(),
        shipmentItems: await prisma.shipmentItem.findMany(),
        costLines: await prisma.costLine.findMany(),
    };

    const backupPath = path.join(__dirname, '../backup/data.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    console.log(`Backup saved to ${backupPath}`);
    console.log('Stats:');
    console.log(`- Users: ${data.users.length}`);
    console.log(`- Suppliers: ${data.suppliers.length}`);
    console.log(`- Products: ${data.products.length}`);
    console.log(`- Shipments: ${data.shipments.length}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
