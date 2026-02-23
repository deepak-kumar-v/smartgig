# Static Audit of `refundEscrow()`

**Date:** 2026-02-20
**Scope:** `src/actions/escrow-actions.ts` - `refundEscrow` function

---

## checklist

### ✅ CHECK 1 — `walletId` used for REFUND entries

**PASS.**
The code uses `clientWallet.id` for the ledger entry:
```typescript
walletId: clientWallet.id,
```
`clientWallet` is resolved via `tx.wallet.findUnique({ where: { userId: clientUserId } })`, where `clientUserId` is firmly established as the contract's client (`contract.client.userId`). The REFUND ledger entry credits the **client wallet only**. No freelancer wallet is referenced.

---

### ✅ CHECK 2 — Amount sign is positive (`+`)

**PASS.**
The amount used is:
```typescript
amount: lockAmount,
```
`lockAmount` is derived from `new Prisma.Decimal(lock.amount)`. `lock.amount` in the `EscrowLock` model is always positive (enforced by the `isPositive()` guard in this very function). The REFUND entry is therefore **positive** (+), appropriately crediting the client's ledger balance to reverse the original negative `ESCROW_LOCK` entry.

---

### ✅ CHECK 3 — Only unreleased locks are refunded

**PASS.**
The filtered list of locks is strictly defined as:
```typescript
const unreleasedLocks = freshEscrow.locks.filter(l => !l.released);
```
The subsequent loop iterates **only** over `unreleasedLocks`. Any lock that was already released (e.g., for a paid milestone) is excluded, preventing double-crediting.

---

### ✅ CHECK 4 — Refund does NOT modify `milestone.status`

**PASS.**
A scan of the transaction body confirms the only models mutated are:
| Model | Operation | Purpose |
|---|---|---|
| `walletLedger` | `create` | Record the refund transaction |
| `escrowLock` | `update` | Mark lock as `released=true` |
| `escrowAccount` | `update` | Set status to `CLOSED` |
| `contract` | `update` | Set status to `CANCELLED` |

There are **zero** `tx.milestone.update` calls. Milestone statuses remain untouched, which is correct as this is a financial reversal, not a milestone workflow state change.

---

### ✅ CHECK 5 — Exact code snippet (Inside Transaction)

```typescript
// A. Re-fetch escrow + all locks INSIDE tx
const freshEscrow = await tx.escrowAccount.findUnique({
    where: { id: escrowId },
    include: { locks: true },
});
if (!freshEscrow) throw new Error('ESCROW_NOT_FOUND_IN_TX');

// B. Re-fetch contract status inside tx
const freshContract = await tx.contract.findUnique({
    where: { id: contractId },
    select: { status: true, clientId: true },
});
if (!freshContract) throw new Error('CONTRACT_NOT_FOUND_IN_TX');
if (!allowedStatuses.includes(freshContract.status)) {
    throw new Error(`CONTRACT_STATUS_INVALID: status=${freshContract.status}`);
}

// C. Ensure client wallet exists inside tx
let clientWallet = await tx.wallet.findUnique({ where: { userId: clientUserId } });
if (!clientWallet) {
    clientWallet = await tx.wallet.create({ data: { userId: clientUserId } });
}

// D. Per unreleased lock: create REFUND ledger credit + mark released
const unreleasedLocks = freshEscrow.locks.filter(l => !l.released);

for (const lock of unreleasedLocks) {
    const lockAmount = new Prisma.Decimal(lock.amount);
    if (!lockAmount.isPositive()) {
        throw new Error(`ESCROW_LOCK_ZERO_AMOUNT: lock ${lock.id} has non-positive amount`);
    }

    // 1. Credit Client Wallet
    await tx.walletLedger.create({
        data: {
            walletId: clientWallet.id,
            amount: lockAmount,                        // +positive
            type: WalletTransactionType.REFUND,
            contractId,
            milestoneId: lock.milestoneId,
        },
    });

    // 2. Release Lock
    await tx.escrowLock.update({
        where: { id: lock.id },
        data: { released: true },
    });

    totalRefunded = totalRefunded.plus(lockAmount);
}

// E. EscrowAccount → CLOSED
await tx.escrowAccount.update({
    where: { id: escrowId },
    data: { status: EscrowStatus.CLOSED },
});

// F. Contract → CANCELLED
await tx.contract.update({
    where: { id: contractId },
    data: { status: ContractStatus.CANCELLED },
});

// G. Assert escrow integrity
await assertEscrowIntegrity(tx, escrowId, contractId);

// H. Client wallet consistency — available >= 0
const clientLedgerSum = await tx.walletLedger.aggregate({
    where: { walletId: clientWallet.id },
    _sum: { amount: true },
});
const clientLockedSum = await tx.escrowLock.aggregate({
    where: {
        released: false,
        escrow: { contract: { clientId: freshContract.clientId } },
    },
    _sum: { amount: true },
});
const clientAvailable = new Prisma.Decimal(clientLedgerSum._sum.amount ?? 0)
    .minus(new Prisma.Decimal(clientLockedSum._sum.amount ?? 0));

if (clientAvailable.isNegative()) {
    throw new Error(
        `WALLET_NEGATIVE_AVAILABLE_ERROR: client available=${clientAvailable} after refund`
    );
}
```

---

### ✅ CHECK 6 — `assertEscrowIntegrity()` runs AFTER ledger writes

**PASS.**
The execution order within the transaction is strictly sequential:
1.  **Ledger creation & Lock updates** (Loop D).
2.  **Escrow status update** (Step E).
3.  **Contract status update** (Step F).
4.  **`assertEscrowIntegrity(tx, ...)`** (Step G).

The integrity check runs **after** all financial writes and state changes, ensuring it validates the final, consistent state of the transaction.

---
**Conclusion:** All 6 checks **PASS**. The `refundEscrow` implementation is structurally sound and adheres to the wallet-first financial architecture.
