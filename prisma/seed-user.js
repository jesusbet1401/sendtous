const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    let user = await prisma.user.findFirst();
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@hifi.cl',
                name: 'Admin User',
                password: 'password123', // Placeholder
                role: 'ADMIN',
            },
        });
        console.log('Created user:', user.id);
    } else {
        console.log('Existing user:', user.id);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
