
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Real Users (Production-like)
    const freelancer = await prisma.user.upsert({
        where: { email: 'freelancer@smartgig.com' },
        update: {},
        create: {
            email: 'freelancer@smartgig.com',
            name: 'Frank Freelancer',
            role: 'FREELANCER',
            freelancerProfile: {
                create: {
                    title: 'Senior Full Stack Developer',
                    bio: 'Expert in React, Node, and Postgres',
                    hourlyRate: 85.0
                }
            }
        }
    })

    const client = await prisma.user.upsert({
        where: { email: 'realclient@smartgig.com' },
        update: {},
        create: {
            email: 'realclient@smartgig.com',
            name: 'Clara Client',
            role: 'CLIENT',
            clientProfile: {
                create: {
                    companyName: 'TechCorp Inc.'
                }
            }
        }
    })

    // 1.5 Create Virtual Demo Users (Bridging Auth and DB)
    // These IDs MUST match src/lib/auth.ts hardcoded values

    // Demo Freelancer
    await prisma.user.upsert({
        where: { id: 'demo-user-id' },
        update: {},
        create: {
            id: 'demo-user-id', // Sync with auth.ts
            email: 'demo@smartgig.com',
            name: 'Demo Freelancer',
            role: 'FREELANCER',
            freelancerProfile: {
                create: {
                    title: 'Demo Developer',
                    bio: 'I am a demo user for testing purposes.',
                    hourlyRate: 50.0
                }
            }
        }
    })

    // Demo Client
    await prisma.user.upsert({
        where: { id: 'client-demo-id' },
        update: {},
        create: {
            id: 'client-demo-id', // Sync with auth.ts
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

    // Demo Admin
    await prisma.user.upsert({
        where: { id: 'admin-demo-id' },
        update: {},
        create: {
            id: 'admin-demo-id', // Sync with auth.ts
            email: 'admin@smartgig.com',
            name: 'Demo Admin',
            role: 'ADMIN'
        }
    })

    console.log(`Created users: ${freelancer.name}, ${client.name}`)

    // 2. Create Ledger Entries (with correct running balance)
    let balance = 0;
    const ledgerEntries = [
        { amount: 5000, type: 'DEPOSIT', reason: 'Initial Deposit', contractId: null },
        { amount: -500, type: 'PLATFORM_FEE', reason: 'Platform fee for Project Alpha', contractId: 'contract-001' },
        { amount: 2500, type: 'ESCROW_RELEASE', reason: 'Milestone 1 Released - Project Alpha', contractId: 'contract-001' },
        { amount: -250, type: 'PLATFORM_FEE', reason: 'Platform fee (10%)', contractId: 'contract-001' },
        { amount: 1800, type: 'ESCROW_RELEASE', reason: 'Milestone 2 Released - Project Beta', contractId: 'contract-002' },
        { amount: -180, type: 'PLATFORM_FEE', reason: 'Platform fee (10%)', contractId: 'contract-002' },
        { amount: 100, type: 'BONUS', reason: 'Referral bonus credited', contractId: null },
        { amount: -3000, type: 'WITHDRAWAL', reason: 'Withdrawal to Bank ****6789', contractId: null },
        { amount: -2.50, type: 'WITHDRAWAL_FEE', reason: 'Withdrawal processing fee', contractId: null },
    ];

    for (const entry of ledgerEntries) {
        balance += entry.amount;
        await prisma.walletLedger.create({
            data: {
                userId: freelancer.id,
                amount: entry.amount,
                type: entry.type,
                reason: entry.reason,
                balanceAfter: balance,
                contractId: entry.contractId,
            }
        });
    }

    console.log(`Created ${ledgerEntries.length} ledger entries for freelancer`)

    // 3. Create Invoice
    const fProfile = await prisma.freelancerProfile.findUnique({ where: { userId: freelancer.id } });
    const cProfile = await prisma.clientProfile.findUnique({ where: { userId: client.id } });

    if (fProfile && cProfile) {
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: 'INV-SEED-001',
                status: 'PAID',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 86400000 * 7),
                paidDate: new Date(),
                clientId: cProfile.id,
                freelancerId: fProfile.id,
                subtotal: 1000,
                taxRate: 0,
                taxAmount: 0,
                platformFee: 100,
                total: 1000,
                lineItems: {
                    create: [
                        { description: 'Seed Project Work', quantity: 10, unitPrice: 100, total: 1000 }
                    ]
                }
            }
        })
        console.log(`Created invoice: ${invoice.invoiceNumber}`)
    }

    console.log('✅ Seed complete')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
