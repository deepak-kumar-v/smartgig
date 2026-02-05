# Walkthrough - Real Proposal Persistence

## Goal
Enable real database storage for freelancer proposals, replacing mock logic with a production-ready flow.

---

## 1. Database Persistence
**File**: `prisma/schema.prisma`

The `Proposal` model was extended to support all core and future-proof fields. Complex data types (milestones, answers, portfolio IDs) are stored as JSON strings for maximum cross-database compatibility (SQLite/PostgreSQL).

**Newly Added Fields**:
- `proposedRate`, `rateType`
- `availability`, `availabilityHoursPerWeek`, `expectedStartDate`
- `acceptsTrialTask`, `trialTaskProposal`, `contractToHireAcceptance`
- `milestones` (JSON)
- `screeningAnswers` (JSON)
- `attachmentsMeta` (JSON)
- `isDraft`, `confidenceScore`, `boosted`, `privateNotes`, `lastEditedAt`

---

## 2. Server Action Wiring
**File**: `src/actions/proposal-actions.ts`

Created `submitProposalV2` which:
1. **Authenticates**: Ensures only `FREELANCER` users can submit.
2. **Validates Job**: Checks if the job exists and its status is still `OPEN`.
3. **Prevents Duplicates**: Blocks multiple active proposals from the same freelancer for the same job.
4. **Persists**: Stores the full payload into the DB.
5. **Revalidates**: Refreshes relevant UI paths.

---

## 3. Frontend Integration
**File**: `src/app/(dashboard)/freelancer/proposals/apply/proposal-form.tsx`

The `handleSubmit` function now:
- Calls `submitProposalV2` with the canonical payload.
- Handles success with a redirect back to "Find Work" (and a success toast/alert).
- Handles errors by showing clear feedback to the user.

---

## Verification Summary
- ✅ Prisma Schema updated and migrated.
- ✅ Server Action implements all logical guards (Auth, Status, Duplicates).
- ✅ Frontend wired to the "real" backend action.
- ✅ Dev server compiles and renders the proposal flow correctly.
- ✅ All future-proof fields are captured in the DB row.
