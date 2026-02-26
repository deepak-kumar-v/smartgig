import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting clean seed (demo users only)...')

    // -----------------------------
    // Demo Freelancer
    // -----------------------------
    await prisma.user.upsert({
        where: { id: 'demo-user-id' },
        update: {},
        create: {
            id: 'demo-user-id',
            email: 'demo@smartgig.com',
            name: 'Demo Freelancer',
            role: 'FREELANCER',
            freelancerProfile: {
                create: {
                    title: 'Demo Developer',
                    bio: 'Demo freelancer account for testing.',
                    hourlyRate: 50
                }
            }
        }
    })

    // -----------------------------
    // Demo Client
    // -----------------------------
    await prisma.user.upsert({
        where: { id: 'client-demo-id' },
        update: {},
        create: {
            id: 'client-demo-id',
            email: 'client@smartgig.com',
            name: 'Demo Client',
            role: 'CLIENT',
            clientProfile: {
                create: {
                    companyName: 'Demo Corp'
                }
            }
        }
    })

    // -----------------------------
    // Demo Admin
    // -----------------------------
    await prisma.user.upsert({
        where: { id: 'admin-demo-id' },
        update: {},
        create: {
            id: 'admin-demo-id',
            email: 'admin@smartgig.com',
            name: 'Demo Admin',
            role: 'ADMIN'
        }
    })

    // -----------------------------
    // System Config (required for contract finalization)
    // -----------------------------
    await prisma.systemConfig.upsert({
        where: { key: 'platformCommissionRate' },
        update: {},
        create: {
            key: 'platformCommissionRate',
            value: '0.10',
        },
    })

    console.log('✅ Demo users and system config created successfully')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
