# Implement Real Proposal Persistence

## Goal
Replace mock proposal submission with real database persistence.

---

## Proposed Changes

### 1. Database Schema
#### [MODIFY] `prisma/schema.prisma`

Extend the `Proposal` model to capture all fields required for a production-grade freelancer platform.

```prisma
model Proposal {
  id                 String  @id @default(cuid())
  
  // Relations
  jobId              String
  job                JobPost @relation(fields: [jobId], references: [id])
  freelancerId       String
  freelancer         FreelancerProfile @relation(fields: [freelancerId], references: [id])
  clientId           String
  client             ClientProfile @relation(fields: [clientId], references: [id])
  
  // Core Data
  coverLetter        String
  proposedRate       Float
  rateType           String  @default("FIXED") // FIXED, HOURLY
  availability       String?
  availabilityHoursPerWeek Int?
  expectedStartDate  DateTime?
  estimatedDuration  String?
  
  // Trial / Contract
  acceptsTrialTask   Boolean @default(false)
  trialTaskProposal  String?
  contractToHireAcceptance Boolean?
  
  // Complex Data (JSON)
  milestones         String? // JSON: {title, description, amount, duration}[]
  totalMilestoneAmount Float?
  screeningAnswers   String? // JSON: Record<questionId, answer>
  selectedPortfolioIds String? // JSON: string[]
  attachments        String? // JSON: metadata
  
  // Meta / System
  status             String  @default("SUBMITTED") // DRAFT, SUBMITTED, WITHDRAWN, ACCEPTED, REJECTED
  isDraft            Boolean @default(false)
  confidenceScore    Float?
  boosted            Boolean?
  privateNotes       String?
  lastEditedAt       DateTime?
  
  // Timestamps
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

---

### 2. Server Action
#### [MODIFY] `src/actions/proposal-actions.ts`

**New Action**: `submitProposalV2(payload: ProposalPayload)`

- **Validation**:
  - Authenticate user (must be FREELANCER).
  - Verify `JobPost` exists and is `OPEN`.
  - Prevent duplicate submissions (check `freelancerId` + `jobId`).
- **Persistence**: Store all payload fields in the DB.
- **Cleanup**: Revalidate relevant paths (`/freelancer/find-work`, etc.).

---

### 3. Frontend Wiring
#### [MODIFY] `src/app/(dashboard)/freelancer/proposals/apply/proposal-form.tsx`

- Replace the mock `handleSubmit` with a call to `submitProposalV2`.
- Handle Success: Show a success toast or redirect to the freelancer proposals list.
- Handle Error: Show a clear error message in the UI.

---

## Verification Checklist
- [ ] Submitting proposal creates a row in the `Proposal` table.
- [ ] All fields (milestones, answers, etc.) are correctly stored as strings/JSON.
- [ ] Duplicate submissions are successfully blocked.
- [ ] Invalid job IDs or closed jobs are rejected.
- [ ] Proposal is correctly linked to the active `FreelancerProfile`.
