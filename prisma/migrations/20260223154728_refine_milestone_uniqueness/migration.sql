-- DropIndex (remove overly-broad composite unique)
DROP INDEX "WalletLedger_milestoneId_type_key";

-- Enforce one ESCROW_RELEASE per milestone
CREATE UNIQUE INDEX unique_escrow_release_per_milestone
ON "WalletLedger" ("milestoneId")
WHERE "type" = 'ESCROW_RELEASE';

-- Enforce one PLATFORM_FEE per milestone
CREATE UNIQUE INDEX unique_platform_fee_per_milestone
ON "WalletLedger" ("milestoneId")
WHERE "type" = 'PLATFORM_FEE';
