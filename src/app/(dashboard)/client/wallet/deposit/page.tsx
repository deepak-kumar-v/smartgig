import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import DepositForm from './deposit-form';

export default async function DepositPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const wallet = await db.wallet.findUnique({
        where: { userId: session.user.id },
    });

    let available = '0.00';
    let total = '0.00';

    if (wallet) {
        const balanceAgg = await db.walletLedger.aggregate({
            where: { walletId: wallet.id },
            _sum: { amount: true },
        });

        const lockedAgg = await db.escrowLock.aggregate({
            where: {
                released: false,
                escrow: { contract: { client: { userId: session.user.id } } },
            },
            _sum: { amount: true },
        });

        const totalDec = new Prisma.Decimal(balanceAgg._sum.amount ?? 0);
        const lockedDec = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);
        total = totalDec.toFixed(2);
        available = totalDec.minus(lockedDec).toFixed(2);
    }

    return <DepositForm available={available} total={total} />;
}
