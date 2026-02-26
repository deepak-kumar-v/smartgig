# SYSTEM INTELLIGENCE DIRECTIVE

> This file is mandatory system law. It governs the evolution and maintenance of the System Intelligence Overlay.

---

## 1. Metadata Registration

Every new page route **MUST** register intelligence metadata in `src/system/intelligence-registry.ts`.

If a page is accessed without registered metadata, the overlay will display:

> "No intelligence metadata registered. This page violates System Intelligence standards."

A development console warning will also be emitted.

---

## 2. Feature Updates

Every new feature **MUST** update the metadata of its page entry in the registry.

Updated fields include (as applicable):
- `capabilities`
- `features`
- `safeguards`
- `attackDefense`
- `microOptimizations`
- `dataFlow`
- `edgeCases`
- `diagrams`

---

## 3. Architectural Changes

Every architectural change **MUST** update:

- `safeguards` of affected pages
- `attackDefense` if new attack vectors are introduced or mitigated
- `microOptimizations` if new indexes or query patterns are added
- `diagrams` if data flow changes
- `concurrencyModel` if transaction boundaries change
- `dependencies` if new action files are introduced

---

## 4. Financial Logic Changes

Every financial logic change **MUST** update:

- **Financial Core** tab content (in overlay component)
- **Transaction Map** tab (function-level detail)
- **Revenue Model** tab (if commission or platform fee logic changes)
- **Scale Hardening** tab (if indexes or query bounds change)

---

## 5. Growth Rule

Intelligence metadata must grow with system complexity.

- New actions → new entries in capabilities and features
- New safeguards → document in safeguards array
- New attack mitigations → document in attackDefense array
- New indexes → document in microOptimizations array

---

## 6. Deletion Prohibition

**Removing metadata is forbidden.**

If a feature is deprecated:
- Mark it as `[DEPRECATED]` in the features array
- Do not delete the entry

---

## 7. Truth Requirement

Intelligence metadata must **always reflect the true current architecture**.

If metadata becomes outdated, it is considered a **system integrity failure**.

---

## 8. Outdated Metadata

Outdated metadata is defined as:
- A feature exists in code but is not documented in the registry
- A safeguard exists in code but is not listed
- An attack defense exists in code but is not documented
- An index exists in schema but is not listed in microOptimizations

---

## 9. AI IDE Rule

Any AI IDE or automated coding assistant modifying financial, contract, messaging, or system architecture **MUST** read this directive before making changes and update the intelligence registry accordingly.

---

## 10. Future Enforcement

- **Phase 1 (current)**: Development console warnings for missing metadata
- **Phase 2 (planned)**: Route scanner utility to verify registry coverage
- **Phase 3 (planned)**: CI/CD enforcement — build fails if route lacks metadata

---

## 11. Version Governance Rule

- `SYSTEM_INTELLIGENCE_VERSION` must increment on major architectural changes.
- All `PageIntelligenceMeta` entries must update their `version` when impacted.
- Metadata `version` mismatch against `SYSTEM_INTELLIGENCE_VERSION` produces a development console warning.
- Drift between metadata and architecture is considered a system integrity failure.
- `lastUpdated` must reflect the actual date of the last metadata modification.

---

# FINANCIAL GOVERNANCE ENFORCEMENT

## Critical Financial Modules

The following components are classified as CRITICAL:

- Wallet
- WalletLedger
- EscrowAccount
- EscrowLock
- WithdrawalRequest
- Commission logic
- validate-finance.ts
- schema.prisma financial models
- FinancialMutationLog
- FinancialErrorLog

---

## Mandatory AI IDE Procedure Before Any Financial Modification

Before modifying ANY of the above:

AI IDE MUST:

1. Read docs/financial-system-maturity.md
2. Re-state the relevant invariants that apply
3. Confirm no invariant is weakened
4. Confirm validate-finance.ts still passes
5. Confirm database-level constraints remain valid
6. Confirm no unique constraint is removed or weakened
7. Confirm no new financial mutation path bypasses idempotency

Failure to do this is a SYSTEM GOVERNANCE VIOLATION.

---

# DATABASE STRUCTURAL HARDENING RULES

The following constraints MUST NOT be removed:

- EscrowLock @@unique([escrowId, milestoneId])
- unique_escrow_release_per_milestone (partial unique index)
- unique_platform_fee_per_milestone (partial unique index)
- Wallet userId @unique
- IdempotencyKey key @unique

If any of these are modified:

AI IDE MUST:
- Explicitly explain why
- Show invariant preservation
- Confirm validate-finance.ts passes

---

# BUILD ENFORCEMENT

validate:finance and validate:intelligence are REQUIRED build steps.

The build must fail if:
- Financial invariants break
- Registry coverage fails
- Inheritance integrity fails
- Governance documentation missing

---

# GOVERNANCE PRINCIPLE

Financial correctness > Feature velocity.

Structural integrity > Convenience.

System invariants are never weakened.