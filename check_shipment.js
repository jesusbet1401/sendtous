
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const id = 'cmkzw6p690002nf3uq9ezusjl'; // The ID from browser
    const shipment = await prisma.shipment.findUnique({
        where: { id },
        select: { id: true, customsCif: true, exchangeRateUsd: true }
    });
    console.log('Shipment:', shipment);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
