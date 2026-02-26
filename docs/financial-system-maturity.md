# Financial System Maturity — SmartGIG

## Current Architecture Level: Structural Enforcement Enabled

The SmartGIG financial system enforces:

---

## 1. Ledger-Based Accounting

All financial movements are append-only via `WalletLedger`.

Supported transaction types:

- DEPOSIT
- ESCROW_LOCK
- ESCROW_RELEASE
- REFUND
- WITHDRAWAL
- PLATFORM_FEE
- ADJUSTMENT

Balances are derived from ledger aggregation.

---

## 2. Escrow Structural Guarantees

Database-level protections:

- One EscrowLock per (escrowId, milestoneId)
- One ESCROW_RELEASE per milestone (partial unique index)
- One PLATFORM_FEE per milestone (partial unique index)

These are enforced at PostgreSQL level.

---

## 3. Sequential Milestone Funding

For FULL contracts:

- Contract must be ACTIVE
- Milestones must be funded sequentially
- A milestone cannot start without funding
- A milestone cannot be submitted without funding
- Previous milestone must be PAID before funding next

This protects client capital.

---

## 4. Wallet Invariants

Production wallet formula:

available = total - locked - pending

System ensures:

- Deposits must never be negative
- Escrow unreleased = lock - release - fee - refund
- payout + commission = lock amount

Enforced via:

scripts/validate-finance.ts

---

## 5. Double-Spend Protection

- Duplicate release per milestone prevented
- Duplicate platform fee prevented
- IdempotencyKey model prevents repeated mutation execution

---

## 6. Mutation Logging

All financial mutations are logged in:

- FinancialMutationLog
- FinancialErrorLog
- LifecycleEvent
- AuditLog

---

## 7. Governance

Financial system changes require:

- Structural documentation update
- Successful validate:finance
- Successful validate:intelligence
- Clean build

---

Status: Structurally hardened, sequential funding enabled.