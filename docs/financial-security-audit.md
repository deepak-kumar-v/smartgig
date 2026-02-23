# 🔒 Static Financial Security Audit — SmartGIG

> **Auditor role:** Paranoid fintech security auditor.
> **Scope:** Wallet-first financial architecture — static analysis only.
> **Date:** 2026-02-19

---

## Section 1 — PASS/FAIL Per Checklist Item

---

### ✅ CHECK 1 — Release Must NOT Double-Debit Client

**PASS.**

In `releaseMilestoneFunds` (lines 143–152), the **only** ledger write inside the transaction is:

```ts
// walletId: freelancerWallet.id, amount: lockAmount (POSITIVE)
type: WalletTransactionType.ESCROW_RELEASE
```

There is **zero** `walletLedger.create` targeting the **client** wallet. The client was debited once at `fundEscrow` time (negative ESCROW_LOCK entry). On release, only `EscrowLock.released = true` changes on the client side — no second debit.

Same conclusion for `approveTrialWork`: only the freelancer wallet receives the credit. ✅

---

### ✅ CHECK 2 — Locked Balance Scope Correctness

**PASS — with one noted limitation (see Section 3, E3).**

`getLockedBalance` (`wallet-actions.ts` lines 49–61):

```ts
where: {
  released: false,                               // ✅ Excludes released locks
  escrow: { contract: { client: { userId } } }   // ✅ CLIENT-scoped only
}
```

- Released locks excluded ✅
- Scoped only to contracts where `client.userId === userId` ✅
- Freelancer wallets are not involved ✅

---

### ⚠️ CHECK 3 — Contract Completion Logic

**PASS (standard contracts) — KNOWN SIMPLIFICATION (trial contracts).**

**Standard (`releaseMilestoneFunds`, lines 167–184):**

```ts
// Re-fetches ALL milestones INSIDE tx after marking this one PAID
const allMilestones = await tx.milestone.findMany(...)
const allPaid = allMilestones.every(m => m.status === MilestoneStatus.PAID);
```

Completion is gated on **every milestone being PAID inside the transaction** — not on ledger sums alone. However, it is milestone-status-based, not lock-release-based (see Section 3, E1).

**Trial (`approveTrialWork`):** completes unconditionally after the single lock is released. Acceptable since trial = exactly 1 milestone enforced upstream.

---

### ✅ CHECK 4 — Decimal Safety

**PASS.**

All backend arithmetic in `escrow-actions.ts`, `escrow-release-actions.ts`, `trial-actions.ts`, `wallet-actions.ts`, and `escrow-integrity.ts` uses:

- `new Prisma.Decimal(x)`, `.plus()`, `.minus()`, `.negated()`, `.isPositive()`, `.isNegative()`, `.equals()`, `.abs()`, `.greaterThan()`

`.toNumber()` is called **only** in:
- Audit log `details` object (JSON serialization — acceptable)
- Lifecycle event `metadata.amount` (display — acceptable)

**One acceptable boundary coercion:**

```ts
// escrow-actions.ts lines 95–98 — pre-tx, for fundingAmount calculation
const fundingAmount = contract.milestones.reduce(
    (sum, m) => sum.plus(m.amount),   // ✅ Decimal.plus(), not JS +
    new Prisma.Decimal(0)
)
```

UI boundary files (`contract-detail-view.tsx`, `services/api/payments.ts`, `lifecycle-events route.ts`) correctly use `.toNumber()` only for display — no backend math affected.

---

### ✅ CHECK 5 — Ledger Immutability

**PASS — Append-only confirmed.**

Grep of entire `src/` for `walletLedger.update`, `walletLedger.delete`, `walletLedger.deleteMany`, `walletLedger.updateMany` returned **zero results**. The ledger is strictly append-only.

---

### ✅ CHECK 6 — Transaction Atomicity

**PASS.**

| Function | Inside `db.$transaction`? |
|---|---|
| `depositToWallet` | ✅ Wallet creation + ledger create |
| `fundEscrow` | ✅ Balance check + escrow create + all locks + all debits + integrity |
| `releaseMilestoneFunds` | ✅ All assertions + credit + lock update + milestone/contract updates |
| `approveTrialWork` | ✅ All assertions + credit + lock update + milestone/contract/escrow updates |

No financial mutation exists outside transactions in any of these four paths.

---

### ✅ CHECK 7 — Race Condition Defense

**PASS.**

| Defense | Status |
|---|---|
| `@@unique([escrowId, milestoneId])` DB constraint | ✅ Present in schema |
| Double-lock prevention inside tx (`findUnique` before `create`) | ✅ `escrow-actions.ts` lines 162–174 |
| Lock re-fetched inside tx before release | ✅ `escrow-release-actions.ts` line 100, `trial-actions.ts` line 70 |
| No pre-tx balance check relied upon for correctness | ✅ Pre-tx checks are early returns for UX only; all financial assertions re-done inside tx |
| `lock.released` checked inside tx | ✅ Both release paths |
| `milestone.status` re-fetched inside tx | ✅ `escrow-release-actions.ts` lines 124–130 |
| `contract.status` re-fetched inside tx | ✅ Lines 133–139 |

---

## Section 2 — Suspicious Patterns

### S1 — `fundingAmount` computed OUTSIDE the transaction _(medium concern)_

```ts
// escrow-actions.ts lines 95–98 — PRE-TRANSACTION
const fundingAmount = contract.milestones.reduce(
    (sum, m) => sum.plus(m.amount),
    new Prisma.Decimal(0)
);
```

`contract.milestones` was fetched outside the tx. If a milestone is **modified concurrently** between the `findUnique` and the `fundEscrow` tx opening, `fundingAmount` will be stale. The `ESCROW_LOCK_TOTAL_MISMATCH` check still passes because both sides use the same stale data. Locks would be created at stale amounts.

**Fix:** Re-fetch milestones inside the transaction.

---

### S2 — `contract.milestones` iterated inside tx without re-fetch

```ts
// escrow-actions.ts line 151 — inside tx, iterating pre-fetched data
for (const milestone of contract.milestones) {
    const milestoneAmount = new Prisma.Decimal(milestone.amount);
```

Same root as S1. The `@@unique` constraint prevents duplicate locks, but amounts are not validated against live DB state inside the tx. Mitigated by the fact that milestones cannot be modified once the contract is FINALIZED — assesses as **low risk today** but structurally fragile.

---

### S3 — `approveTrialWork`: `contract.status` NOT re-fetched inside tx

```ts
// trial-actions.ts line 49 — PRE-tx only
if (contract.status !== ContractStatus.ACTIVE) return { error: 'Contract not active' };

// Inside tx — NO freshContract status re-fetch
// (unlike releaseMilestoneFunds which re-fetches at lines 133–139)
```

If the contract transitions from ACTIVE to COMPLETED/CANCELLED between the pre-tx check and the tx opening, the release proceeds against a non-ACTIVE contract. The `lock.released` guard prevents double-payment but the state inconsistency exists.

---

### S4 — `freelancerAvailable` check in `approveTrialWork` is incomplete

```ts
// trial-actions.ts line 130
const freelancerAvailable = new Prisma.Decimal(freelancerLedgerSum._sum.amount ?? 0);
// Missing: subtract freelancerLockedSum
```

Computes **total ledger balance**, not `balance - locked`. Compare with `releaseMilestoneFunds` which correctly subtracts `freelancerLockedSum`. Harmless today since freelancers have no locking mechanism, but architecturally inconsistent.

---

### S5 — String literals instead of enum references in `escrow-integrity.ts`

```ts
// escrow-integrity.ts lines 79, 87
type: 'ESCROW_LOCK',
type: 'ESCROW_RELEASE',
```

Should be `WalletTransactionType.ESCROW_LOCK` / `WalletTransactionType.ESCROW_RELEASE`. A future enum rename would not be caught by the compiler at this callsite.

---

## Section 3 — Edge Cases Not Handled

### E1 — COMPLETED trigger is milestone-status-based, not lock-release-based _(medium)_

```ts
const allPaid = allMilestones.every(m => m.status === MilestoneStatus.PAID);
if (allPaid && !hasDisputed) → contract COMPLETED
```

If a bug sets a milestone to PAID without releasing its lock, the contract would be marked COMPLETED while the escrow still holds unreleased funds. A stronger check would additionally assert `allLocks.every(l => l.released)` before marking COMPLETED.

---

### E2 — No refund path exists for locked escrow funds _(high)_

If a contract is DISPUTED or CANCELLED after being FUNDED, locked funds in `EscrowLock` have no programmatic release back to the client. `WalletTransactionType.REFUND` exists in the enum but no action function uses it. Funds become permanently locked at the DB level with no recovery path without direct DB intervention.

**This is a missing workflow, not a bug in existing code — but it is an operational blocker for real-money deployment.**

---

### E3 — TOCTOU between `getAvailableBalance` UI calls and `fundEscrow` tx _(low)_

`getLockedBalance` and `getAvailableBalance` run outside any transaction and are used for UI display. If UI actions gate on `getAvailableBalance` before calling `fundEscrow`, there is a TOCTOU window. Mitigated because `fundEscrow` re-checks balance inside the tx — the UI check is purely cosmetic.

---

### E4 — Optimistic concurrency on `fundEscrow` contract update ✅ _(well-handled)_

```ts
// escrow-actions.ts line 208
await tx.contract.update({
    where: { id: contractId, status: ContractStatus.FINALIZED },
    data: { status: ContractStatus.FUNDED },
});
```

The `where` clause includes `status: FINALIZED` — if another process already changed the status, Prisma throws `RecordNotFound`, rolling back the transaction. This is a correct optimistic concurrency pattern.

---

## Section 4 — Severity Ratings

| ID | Finding | Severity |
|---|---|---|
| S1 | `fundingAmount` + milestone data fetched pre-tx, not re-validated inside tx | **Medium** |
| S2 | FINALIZED status not re-fetched inside `fundEscrow` tx | **Low** |
| S3 | `contract.status` not re-fetched inside `approveTrialWork` tx | **Medium** |
| S4 | `freelancerAvailable` in `approveTrialWork` omits locked balance subtraction | **Low** |
| S5 | String literals instead of enum references in `escrow-integrity.ts` | **Low** |
| E1 | COMPLETED triggered by milestone status, not lock released state | **Medium** |
| E2 | No refund/cancellation path for locked escrow funds | **High** |
| E3 | TOCTOU between `getAvailableBalance` UI calls and `fundEscrow` tx | **Low** |

---

## Section 5 — Overall Production Readiness Score

```
Score: 74 / 100
```

**Breakdown:**

| Category | Assessment |
|---|---|
| Core atomic safety | ✅ Solid — no double-debits, no ledger mutations |
| Decimal precision | ✅ Correctly enforced across all financial paths |
| DB-level uniqueness | ✅ `@@unique` on EscrowLock prevents duplicate locks |
| Double-release prevention | ✅ Rock-solid — lock re-fetched and `released` re-checked inside every tx |
| Stale pre-tx data (S1, S3) | ⚠️ Two real attack vectors — partial mitigations only |
| Missing refund workflow (E2) | 🔴 Operational blocker for real-money deployment |

> **This code is sufficient for internal staging. It is NOT ready for production with real money until E2 (refund path) is implemented and S1/S3 are hardened.**

---

## Recommended Fixes (Priority Order)

| Priority | Fix |
|---|---|
| 🔴 Critical | Implement `refundEscrow` action — REFUND ledger entry back to client wallet for cancelled/disputed contracts |
| 🟠 Medium | Re-fetch milestones **inside** `fundEscrow` tx — don't trust pre-tx `contract.milestones` for amounts |
| 🟠 Medium | Add `freshContract.status` re-fetch inside `approveTrialWork` tx — mirrors existing logic in `releaseMilestoneFunds` |
| 🟠 Medium | Add `allLocks.every(l => l.released)` guard before marking contract COMPLETED in `releaseMilestoneFunds` |
| 🟡 Low | Replace string literals `'ESCROW_LOCK'`/`'ESCROW_RELEASE'` with `WalletTransactionType` enum in `escrow-integrity.ts` |
