# SmartGIG — Codebase Scan Report

**Date:** 2026-02-18  
**Scope:** Escrow, Milestone, Withdrawal, and Payments modules

---

## 1) Escrow / Funding Server Actions

| Capability | Status | Details |
|---|---|---|
| **Creates EscrowAccount** | ❌ NOT IMPLEMENTED | No server action creates an `EscrowAccount` via Prisma. The model exists in `prisma/schema.prisma` (line 344) and a TypeScript interface exists in `src/lib/types.ts` (line 534), but no action writes to the DB table. |
| **Funds escrow** | ⚠️ PARTIAL (mock only) | `src/lib/services.ts` has a mock-only `depositToEscrow()` (line 409) that returns a mock object without any DB writes. No real server action funds escrow. |
| **Releases milestone payments** | ⚠️ PARTIAL (mock only) | `src/lib/services.ts` has mock-only `requestRelease()` (line 421) and `approveRelease()` (line 432) — both just look up mock data and return it. No real DB writes. |
| **Writes to EscrowTransaction** | ❌ NOT IMPLEMENTED | The `EscrowTransaction` model exists in `prisma/schema.prisma` (line 355). No code writes to it anywhere. |
| **Writes to WalletLedger** | ❌ NOT IMPLEMENTED | The `WalletLedger` model exists in `prisma/schema.prisma` (line 364). `src/services/api/payments.ts` reads from the ledger API only. No code creates WalletLedger entries. |
| **Uses MockEscrowTransaction** | ✅ EXISTS | `src/actions/trial-actions.ts` — the `approveTrialWork()` function (line 33) creates a `db.mockEscrowTransaction.create(...)` record when a trial is approved. Schema model at `prisma/schema.prisma` line 314. |

### Key files found:

- `prisma/schema.prisma` — `EscrowAccount` (line 344), `EscrowTransaction` (line 355), `MockEscrowTransaction` (line 314), `WalletLedger` (line 364)
- `src/lib/types.ts` — `EscrowAccount` interface (line 534), `EscrowStatus` type (line 26)
- `src/lib/services.ts` — Mock escrow functions: `getEscrowAccount`, `depositToEscrow`, `requestRelease`, `approveRelease` (lines 404–441)
- `src/lib/mock-data.ts` — `mockEscrowAccounts` array (line 594)
- `src/actions/trial-actions.ts` — Only file that writes to `MockEscrowTransaction` (line 33)

---

## 2) Escrow API Routes

**❌ NOT IMPLEMENTED**

No `/api/escrow/*` routes exist anywhere in the codebase.

The only payment-related API routes found:
- `src/app/api/payments/ledger/route.ts` — reads WalletLedger entries

---

## 3) Milestone Server Actions

| Capability | Status | Details |
|---|---|---|
| **Submits deliverable** | ❌ NOT IMPLEMENTED | No `submitDeliverable` action exists anywhere in the codebase. |
| **Approves milestone** | ❌ NOT IMPLEMENTED | No `approveMilestone` server action exists. |
| **Requests revision** | ⚠️ UI STUB ONLY | `src/app/(dashboard)/contracts/[id]/page.tsx` has UI buttons and an `onRequestRevision` callback (line 99), but no actual server action backs it — it's a client-side stub. |
| **Releases payment** | ❌ NOT IMPLEMENTED | No `releasePayment` server action exists. |

### What does exist (mock/type-level only):

- `src/lib/services.ts` — Mock `updateMilestoneStatus()` (line 388) that accepts status changes but does **nothing real** (comment: `// Would update milestone status`).
- `src/lib/types.ts` — `MilestoneStatus` type (line 24): `'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PAID'`
- `src/lib/types.ts` — `Milestone` interface (line 473)
- `src/lib/audit-service.ts` — Audit event types defined: `MILESTONE_CREATED`, `MILESTONE_SUBMITTED`, `MILESTONE_APPROVED`, `MILESTONE_REJECTED`, `MILESTONE_REVISION_REQUESTED` (lines 34–39)

### Server actions directory (`src/actions/`):

```
auth-actions.ts
chat-upload-actions.ts
contract-actions.ts
job-actions-v2.ts
onboarding-actions.ts
proposal-actions.ts
trial-actions.ts
trust-actions.ts
upload-actions.ts
```

**No `escrow-actions.ts` or `milestone-actions.ts` file exists.**

---

## 4) Withdrawal Logic

| Item | Status | Details |
|---|---|---|
| **`withdrawal-actions.ts`** | ❌ NOT IMPLEMENTED | This file does not exist anywhere in `src/`. |
| **`/api/withdrawals/*` route** | ❌ NOT IMPLEMENTED | No API routes for withdrawals exist. |
| **Mock withdrawal functions** | ✅ EXISTS | `src/lib/payments-service.ts` contains mock in-memory functions: `getWithdrawals()` (line 479), `getWithdrawal()` (line 483), `requestWithdrawal()` (line 487). |
| **Withdrawal UI page** | ✅ EXISTS | `src/app/(dashboard)/freelancer/withdraw/page.tsx` (18,350 bytes) — client-side page that calls mock `requestWithdrawal`. |
| **Client withdraw page** | ❌ NOT IMPLEMENTED | No withdraw page exists under `src/app/(dashboard)/client/`. |

---

## 5) Payments UI Pages

| Page | Status | Path | Size |
|---|---|---|---|
| Client Payments | ✅ EXISTS | `src/app/(dashboard)/client/payments/page.tsx` | 16,598 bytes |
| Freelancer Payments | ✅ EXISTS | `src/app/(dashboard)/freelancer/payments/page.tsx` | 16,598 bytes |
| Client Payment Methods | ✅ EXISTS | `src/app/(dashboard)/client/payments/methods/page.tsx` | 19,847 bytes |
| Freelancer Payment Methods | ✅ EXISTS | `src/app/(dashboard)/freelancer/payments/methods/page.tsx` | 19,847 bytes |

Both `client/payments/` and `freelancer/payments/` also include `error.tsx` and `loading.tsx` companion files.

---

## Summary

| Module | Real Server Actions | API Routes | UI Pages | Mock/Type Definitions |
|---|---|---|---|---|
| **Escrow** | ❌ (only `MockEscrowTransaction` in trial-actions) | ❌ | N/A | ✅ Schema, types, mock data |
| **Milestones** | ❌ | ❌ | ⚠️ UI stubs in contract detail page | ✅ Types, audit events, mock fn |
| **Withdrawals** | ❌ | ❌ | ✅ Freelancer only | ✅ Mock functions |
| **Payments** | ❌ | ⚠️ `/api/payments/ledger` only | ✅ All 4 pages exist | ✅ Full mock service |
