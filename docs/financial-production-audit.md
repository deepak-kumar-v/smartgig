# Financial Production Audit Report

**Auditor**: Automated Paranoid Fintech Audit  
**Date**: 2026-02-23  
**Scope**: Wallet, WalletLedger, EscrowLock, EscrowAccount, Contract.commissionRate, all financial server actions, UI aggregations  
**Files Audited**: 10 source files, 12 functions

---

## 1. PASS / FAIL Matrix

| # | Category | Verdict | Detail |
|---|----------|---------|--------|
| 1 | Commission split math | **PASS** | `freelancerPayout + commissionAmount === lockAmount` enforced via `COMMISSION_SPLIT_INCONSISTENT` assertion in both `releaseMilestoneFunds` and `approveTrialWork`. Uses `Prisma.Decimal.mul()` and `.minus()`. No Float. |
| 2 | PLATFORM_FEE + ESCROW_RELEASE = lockAmount | **PASS** | Ledger entries created atomically inside same tx. Commission split assertion fires before writes. |
| 3 | Serializable isolation — `releaseMilestoneFunds` | **PASS** | `{ isolationLevel: 'Serializable' }` on L283 of `escrow-release-actions.ts`. |
| 4 | Serializable isolation — `approveTrialWork` | **FAIL** | **Missing `{ isolationLevel: 'Serializable' }` on `db.$transaction()` call at L69 of `trial-actions.ts`.** Defaults to database-level default (likely `ReadCommitted`). Race condition window exists. |
| 5 | Serializable isolation — `fundEscrow` | **PASS** | `{ isolationLevel: 'Serializable' }` on L266 of `escrow-actions.ts`. |
| 6 | Serializable isolation — `refundEscrow` | **PASS** | `{ isolationLevel: 'Serializable' }` on L492 of `escrow-actions.ts`. |
| 7 | Serializable isolation — `requestWithdrawal` | **PASS** | `Prisma.TransactionIsolationLevel.Serializable` on L73 of `withdrawal-actions.ts`. |
| 8 | Serializable isolation — `approveWithdrawal` | **PASS** | `Prisma.TransactionIsolationLevel.Serializable` on L168 of `withdrawal-actions.ts`. |
| 9 | Double-release prevention | **PASS** | `lock.released === true` check inside tx in both release paths. |
| 10 | Double-fund prevention | **PASS** | `freshContract.escrowAccount` existence check inside tx (L130 `escrow-actions.ts`). |
| 11 | Double-lock prevention | **PASS** | Per-milestone `escrowLock.findUnique` inside tx before creating (L193 `escrow-actions.ts`). |
| 12 | Wallet consistency (freelancer) | **PASS** | Post-release `freelancerAvailable >= 0` assertion inside tx. |
| 13 | Wallet consistency (platform) | **PASS** | Post-credit `platformAvailable >= 0` assertion inside tx. |
| 14 | Wallet consistency (client — fund) | **PASS** | Post-lock `postAvailable >= 0` assertion inside tx. |
| 15 | Wallet consistency (client — refund) | **PASS** | Post-refund `clientAvailable >= 0` assertion inside tx. |
| 16 | Escrow integrity assertion | **PASS** | `assertEscrowIntegrity()` called inside tx in `fundEscrow`, `refundEscrow`, `releaseMilestoneFunds`, `approveTrialWork`. Formula: `unreleased = |ESCROW_LOCK| - ESCROW_RELEASE - PLATFORM_FEE - REFUND`. |
| 17 | Milestone-scoped ledger queries | **PASS** | All ledger queries in `assertEscrowIntegrity`, `getContractEscrowData`, `getContractFinancialTimeline` use `milestoneId: { in: [...] }`. No contractId-only financial aggregations. |
| 18 | Withdrawal — pending deduction | **FAIL** | `approveWithdrawal` (L133) computes `availableBalance = totalBalance - lockedBalance` but does **NOT subtract other pending withdrawals**. If user has 2 pending withdrawals of $50 each against $100 available, both can be approved. |
| 19 | Withdrawal — request safety | **PASS** | `requestWithdrawal` correctly subtracts pending withdrawals (L56). |
| 20 | Client sees gross release | **PASS** | UI uses `escrow.totalReleased` = `releasedToFreelancer + platformFeesPaid`. |
| 21 | Freelancer sees net release | **PASS** | UI uses `escrow.releasedToFreelancer` (ESCROW_RELEASE sum only). |
| 22 | Commission hidden from client | **PASS** | ClientPanel renders zero commission/platform-fee rows. |
| 23 | Commission visible to freelancer | **PASS** | FreelancerPanel shows Platform Commission line and per-milestone breakdown. |
| 24 | No money creation/destruction | **PASS** | Every release creates exactly `ESCROW_RELEASE + PLATFORM_FEE = lockAmount`. Refund returns exact lock amount. No path creates unbacked credits. |
| 25 | Idempotency | **PASS** | `releaseMilestoneFunds` and `fundEscrow` support `idempotencyKey` with pre-check + in-tx create. |
| 26 | `refundEscrow` audit log — `isAdmin` scope | **FAIL** | L509 `escrow-actions.ts` references `isAdmin` variable which is declared at L355 (inside the `try` block but outside the `db.$transaction`). It is valid JavaScript scope, but the variable is only set based on the pre-tx session check. **This is a runtime error bug**: `isAdmin` is `const` declared inside the `try` block at function scope, so it IS accessible at L509. No bug. Re-evaluated: **PASS** (scope is correct). |

---

## 2. Critical Vulnerabilities

### CRITICAL-1: `approveTrialWork` Missing Serializable Isolation

**File**: [trial-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/trial-actions.ts#L69)  
**Line**: 69  
**Severity**: CRITICAL

```typescript
// CURRENT (L69):
await db.$transaction(async (tx) => {
    // ... financial operations ...
});

// REQUIRED:
await db.$transaction(async (tx) => {
    // ... financial operations ...
}, { isolationLevel: 'Serializable' });
```

**Impact**: Without Serializable isolation, two concurrent `approveTrialWork` requests for the same contract could both pass the `lock.released === false` check before either commits. This could cause a **double-release** — crediting the freelancer twice and creating duplicate PLATFORM_FEE entries.

**Likelihood**: Low (trial contracts have a single milestone, and concurrent approval is unlikely in normal usage), but the window exists and is exploitable.

**Fix**: Add `{ isolationLevel: 'Serializable' }` to the `db.$transaction()` call.

---

### CRITICAL-2: `approveWithdrawal` Does Not Subtract Pending Withdrawals

**File**: [withdrawal-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/withdrawal-actions.ts#L131-L133)  
**Lines**: 131–133

```typescript
// CURRENT:
const availableBalance = totalBalance.minus(lockedBalance);

// REQUIRED:
const pendingAgg = await tx.withdrawalRequest.aggregate({
    where: { userId: request.userId, status: 'PENDING', id: { not: requestId } },
    _sum: { amount: true },
});
const pendingAmount = new Prisma.Decimal(pendingAgg._sum.amount ?? 0);
const availableBalance = totalBalance.minus(lockedBalance).minus(pendingAmount);
```

**Impact**: If a user has 2 pending withdrawal requests (e.g., $50 + $50) and $100 available, an admin could approve both. The first deducts $50 via ledger, leaving $50. The second re-checks and also passes ($50 available >= $50 requested). Net result: $100 withdrawn correctly. **However**, the post-debit assertion using stale `lockedBalance` could mask edge cases where locked balance changes between the two approvals.

**Actual double-spend risk**: Mitigated by Serializable isolation (transactions are serialized at DB level), so concurrent approvals would be blocked. But the missing deduction means the **pre-debit assertion is weaker than it should be** and does not match `requestWithdrawal`'s formula.

**Fix**: Add pending withdrawal subtraction (excluding current request) to `approveWithdrawal`.

---

## 3. Medium Risks

### MEDIUM-1: `error: any` Types in Withdrawal Actions

**File**: [withdrawal-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/withdrawal-actions.ts#L76-L78)  
**Lines**: 76, 171

```typescript
} catch (error: any) {
    return { error: error.message || '...' };
}
```

Two catch blocks use `error: any`. This is a type-safety violation. If `error` is not an `Error` instance, `.message` access is unsafe.

**Fix**: Use `error instanceof Error ? error.message : 'Failed to ...'` pattern (already used in other actions).

---

### MEDIUM-2: `rejectWithdrawal` Not Inside Transaction

**File**: [withdrawal-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/withdrawal-actions.ts#L191-L203)

The status check (`request.status !== 'PENDING'`) and the update happen in two separate queries with no transaction. A race condition exists where two concurrent reject calls could both read `status === 'PENDING'`, but this is benign (both would set status to REJECTED, which is idempotent). Still, this is inconsistent with the pattern used elsewhere.

**Fix**: Wrap in `db.$transaction` or use `updateMany` with `where: { id: requestId, status: 'PENDING' }` and check `count > 0`.

---

### MEDIUM-3: `approveTrialWork` Missing In-Tx Milestone Status Check

**File**: [trial-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/trial-actions.ts#L69-L187)

Unlike `releaseMilestoneFunds` which re-fetches milestone status inside the transaction (L144–L150), `approveTrialWork` does NOT re-fetch the milestone status inside the tx. It relies on the pre-tx contract fetch (L47). If the milestone status changed between the outer read and the start of the transaction, the assertion would be missed.

**Impact**: Low — trial contracts have a single milestone and the status change would need to happen in a very narrow window. But the pattern is inconsistent with `releaseMilestoneFunds`.

**Fix**: Add `tx.milestone.findUnique({ where: { id: milestone.id } })` inside the transaction and assert status.

---

## 4. Minor Inconsistencies

### MINOR-1: Tolerance in Escrow Integrity Check

**File**: [escrow-integrity.ts](file:///c:/Users/Acer/Music/new/src/lib/escrow-integrity.ts#L128)

```typescript
if (unreleasedTotal.minus(expectedUnreleased).abs().greaterThan('0.001'))
```

The 0.001 tolerance is unnecessary because all arithmetic uses `Prisma.Decimal` (arbitrary precision). If a mismatch exists, it indicates a real accounting error, not a rounding artifact. The tolerance could hide a genuine sub-cent discrepancy.

**Recommendation**: Tighten to `0` (exact match). If Prisma.Decimal arithmetic is truly precise, tolerance should be zero.

---

### MINOR-2: `refundEscrow` Marks Locks as `released = true`

**File**: [escrow-actions.ts](file:///c:/Users/Acer/Music/new/src/actions/escrow-actions.ts#L449-L452)

Refunded locks are marked `released = true` (same as successfully released locks). This makes the `released` field ambiguous — it means "funds are no longer locked" rather than "funds were paid to freelancer." The `financialState` derivation in `escrow-data-actions.ts` correctly distinguishes by checking for REFUND ledger entries, so this is functionally correct but semantically confusing.

**Impact**: None. The distinction is resolved by ledger entry type.

---

## 5. Production Readiness Score

## **82 / 100**

**Breakdown**:

| Area | Score | Max | Notes |
|------|-------|-----|-------|
| Ledger correctness | 20 | 20 | All paths balanced. Commission split enforced. |
| Transaction isolation | 15 | 20 | `approveTrialWork` missing Serializable. |
| Double-spend prevention | 18 | 20 | Withdrawal approval has a weaker pre-check than request. |
| Role correctness | 10 | 10 | Client/Freelancer views correctly isolated. |
| Escrow invariants | 9 | 10 | Tolerance should be zero. |
| Type safety | 5 | 10 | Two `any` types remain. |
| UI aggregation | 5 | 5 | All milestoneId-scoped, grossed/netted correctly. |
| Audit trail | 5 | 5 | AuditLog + LifecycleEvent on all mutating paths. |
| **Total** | **82** | **100** | |

---

## 6. Required Fixes (Exact and Actionable)

### FIX-1: Add Serializable to `approveTrialWork` [CRITICAL]

**File**: `src/actions/trial-actions.ts`, Line 69

```diff
-        await db.$transaction(async (tx) => {
+        await db.$transaction(async (tx) => {
             // ... existing body unchanged ...
-        });
+        }, { isolationLevel: 'Serializable' });
```

---

### FIX-2: Subtract Pending Withdrawals in `approveWithdrawal` [CRITICAL]

**File**: `src/actions/withdrawal-actions.ts`, Lines 131–133

```diff
             const totalBalance = new Prisma.Decimal(balanceAgg._sum.amount ?? 0);
             const lockedBalance = new Prisma.Decimal(lockedAgg._sum.amount ?? 0);
-            const availableBalance = totalBalance.minus(lockedBalance);
+
+            // Subtract OTHER pending withdrawals (exclude this request being approved)
+            const otherPendingAgg = await tx.withdrawalRequest.aggregate({
+                where: { userId: request.userId, status: 'PENDING', id: { not: requestId } },
+                _sum: { amount: true },
+            });
+            const otherPending = new Prisma.Decimal(otherPendingAgg._sum.amount ?? 0);
+            const availableBalance = totalBalance.minus(lockedBalance).minus(otherPending);
```

---

### FIX-3: Replace `error: any` in withdrawal-actions.ts [MEDIUM]

**File**: `src/actions/withdrawal-actions.ts`, Lines 76 and 171

```diff
-    } catch (error: any) {
-        console.error('[requestWithdrawal] Error:', error);
-        return { error: error.message || 'Failed to submit withdrawal request' };
+    } catch (error) {
+        console.error('[requestWithdrawal] Error:', error);
+        return { error: error instanceof Error ? error.message : 'Failed to submit withdrawal request' };
     }
```

Apply same pattern at Line 171 for `approveWithdrawal`.

---

### FIX-4: Tighten Escrow Integrity Tolerance to Zero [MINOR]

**File**: `src/lib/escrow-integrity.ts`, Line 128

```diff
-    if (unreleasedTotal.minus(expectedUnreleased).abs().greaterThan('0.001')) {
+    if (!unreleasedTotal.equals(expectedUnreleased)) {
```

---

**End of Audit.**
