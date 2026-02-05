# Future Upgrades & Deferred Enhancements

> This file tracks planned improvements. No item listed here is implemented unless explicitly stated elsewhere.

## Job Visibility Enhancements (Deferred)

### Feature: “Recently Updated” Indicator

**Description**:
- Display an “Updated X minutes ago” label when a job is edited.
- This indicator MUST coexist with the original “Posted X minutes ago” label.
- The original post timestamp must never be removed or replaced.
- If a job has never been edited, only the “Posted” indicator should appear.
- This enhancement is informational only and does not affect job sorting or visibility logic.

**Status**:
- Deferred
- Not required for current MVP
- To be implemented only when explicitly requested

**Note**: This file will be appended incrementally. New items must be added explicitly and one at a time.

No runtime behavior, UI, database schema, or application logic was modified.
## UI Performance & Loading Experience (Deferred)

### Feature: Optimistic UI for Mutations

**Description**:
- Apply optimistic UI updates for selected user actions (e.g., Post Job, Edit Job).
- UI should respond immediately on user action without waiting for server confirmation.
- Server action runs in background; UI rolls back only on failure.
- No change to backend transaction integrity or validation rules.

**Scope (Planned)**:
- Post Job submission
- Edit Job updates
- Non-financial, non-destructive actions only

**Status**:
- Deferred
- Not required for current MVP
- To be implemented only when explicitly requested

---

### Feature: Skeleton Loaders for Data Fetching

**Description**:
- Replace blank screens or spinners with skeleton loaders while data is loading.
- Skeletons visually represent the final layout (cards, lists, text blocks).
- Improves perceived performance during first-time page loads and slow networks.

**Use Cases (Planned)**:
- Dashboards (Client / Freelancer / Admin)
- Job lists and job details pages
- Messages and contracts pages

**Status**:
- Deferred
- UI enhancement only
- No impact on business logic or data flow

---

### Feature: Custom Global Loading Animation

**Description**:
- Introduce a consistent, branded loading animation for route transitions and async actions.
- Used only when skeleton loaders are not applicable (e.g., full-page transitions).
- Should feel lightweight and non-blocking.

**Status**:
- Deferred
- Visual enhancement only
- To be designed and implemented later


## Job Description Rich Text Formatting (Deferred)

**Description**:
- Enable rich text formatting for the Job Description field (similar to Notion/GitHub).
- Allow clients to apply basic formatting such as:
  - Bold, Italic, and Strikethrough
  - Headings (H1, H2, H3)
  - Bullet and numbered lists
  - Inline links and code blocks
- Formatting will be applied via a controlled toolbar (no raw HTML input).

**Technical Approach (Planned)**:
- Use a Markdown-based editor for simplicity and safety.
- Store job descriptions as sanitized Markdown strings.
- Render formatted content consistently across:
  - Job posting flow (Step 1)
  - Review card (Step 6)
  - Job details page
  - Freelancer job view

**Constraints**:
- Formatting support will be limited to Job Description only.
- Content must be sanitized to prevent XSS and malformed rendering.
- Preview and final rendered output must remain visually consistent.

**Status**:
- Deferred
- Not required for current MVP
- To be implemented only after core workflows are fully stabilized


## Draft Job Posting (Deferred)

**Current State**:
- The “Save Draft” button in the Post Job flow is a UI-level feature only.
- It provides visual feedback to the user (toast / indicator) but does not persist data.
- Draft data is not stored in the database and does not survive page refresh or navigation.

**Planned Enhancement**:
- Implement true draft persistence for job posts.
- Allow incomplete job data to be saved without full validation.
- Enable users to resume drafting a job after logging out or refreshing the page.

**Possible Implementations (Future)**:
- Local storage–based drafts for lightweight persistence.
- Database-backed draft jobs with a `DRAFT` status.
- Auto-save drafts with debounced updates.
- Clear distinction between Draft and Published jobs in the client dashboard.

**Status**:
- Deferred
- Not required for current MVP
- Will be implemented only when explicitly planned

## AI-Assisted Job Description (Deferred)

### Feature: Two-Stage AI Assistance for Detailed Project Description

**Problem**
Many clients struggle to write structured or Markdown-based job descriptions. Direct AI-generated Markdown is difficult to review and can introduce formatting noise or hallucinated content.

**Proposed Solution**
Introduce a two-stage AI-assisted writing flow that separates content quality from formatting.

---

### Stage 1: Plain English Draft (AI Assist)

**Behavior**
- Client provides rough input (plain text, bullets, notes).
- AI rewrites the content in **plain English only**.
- No Markdown syntax is used.
- Output focuses purely on clarity, completeness, and professionalism.
- The generated draft is fully editable by the user.

**Purpose**
- Allow users to review *what is being said*, not *how it is formatted*.
- Reduce cognitive load and AI trust issues.

---

### Stage 2: Markdown Conversion (Explicit User Action)

**Trigger**
- User clicks an explicit action (e.g. “Convert to Markdown”).

**Behavior**
- AI converts the **approved plain-English draft** into clean, GitHub-style Markdown.
- Markdown is inserted into the existing Markdown editor.
- User can further edit before submission.

---

### Guardrails (Strict)
- AI output never auto-saves.
- AI never overwrites user content silently.
- Markdown is generated only after explicit approval.
- Final persisted content is always user-approved.

---

### Technical Notes
- No database schema changes required.
- Works with existing `descriptionMd` field.
- AI operates only at the UI layer.
- Final Markdown remains fully editable.

---

**Status**
- Deferred
- To be implemented only after post-job-v3-2 is stable
- Requires explicit opt-in by the user

## Database Cleanup (Deferred)

### Remove Legacy `description` Field from JobPost

**Current State**
- JobPost contains three fields:
  - `overview` – short summary (active)
  - `descriptionMd` – markdown content (active)
  - `description` – legacy fallback (deprecated)

- New jobs **do NOT rely** on `description` for rendering or logic.
- `description` exists solely as a **safety fallback** for:
  - Legacy jobs
  - Broken or incomplete freelancer views
  - Avoiding breaking schema constraints during transition

**Why This Exists (Intentional Tech Debt)**
- Freelancer UI is currently unstable and partially inconsistent.
- Removing `description` now would force immediate fixes across:
  - Freelancer job detail pages
  - Public/explore job views
- This would significantly expand scope and slow core development.

**Planned Removal**
This field will be removed ONLY when:
1. Freelancer job views are redesigned and stabilized
2. All job rendering paths consume `overview` + `descriptionMd`
3. Existing job records are migrated or cleared intentionally
4. A dedicated DB cleanup phase is executed

**Rule**
- No new feature may depend on `description`
- No UI logic should read from `description` unless explicitly handling legacy data

**Status**
- Deferred
- Intentional
- Safe to ignore until Freelancer UI refactor phase


# 🔮 Future Enhancements

This document tracks **planned but intentionally unimplemented features**.  
These items are documented early to avoid architectural drift and rushed decisions later.

---

## 1️⃣ Developer Login Bypass (Dev-Only Productivity Feature)

### Problem
During active development, repeatedly logging in with credentials slows down testing and iteration—especially when frequently switching between **freelancer** and **client** roles.

### Decision
Introduce a **development-only quick login mechanism** that allows instant access to existing user profiles without typing credentials, while keeping the real authentication system fully intact.

### Core Principles
- Login & Signup pages **must remain unchanged**
- Authentication system **must not be removed or weakened**
- Feature is **strictly DEV-only**
- No production behavior should be affected
- No backend auth hacks or shortcuts

### Planned Behavior
- Dev-only page (example: `/dev/quick-login`)
- Split layout:
  - **Left:** Freelancer profiles
  - **Right:** Client profiles
- Each profile card displays:
  - Name
  - Role
  - “Login as” button
- Clicking a profile:
  - Creates a session using the **existing auth/session system**
  - Redirects to the correct dashboard
- No password required
- Disabled entirely in production builds

### Why This Exists
This is a **developer productivity tool**, not an authentication feature.  
It accelerates development while preserving production-grade security.

---

## 2️⃣ Dashboard Version Cleanup & Canonical Routing

### Problem
Multiple dashboard versions (`dashboard-v2`, `dashboard-v3`, etc.) increase confusion, maintenance cost, and mental overhead.

### Decision
Adopt a **single canonical dashboard route per role** once features stabilize.

### Canonical Routes
- `/client/dashboard`
- `/freelancer/dashboard`

### Versioning Rules
- Version suffixes (`-v2`, `-new`) are **temporary**
- Once a version is stable:
  - Rename it to the canonical route
  - Update all links, redirects, and revalidation paths
  - Remove older versions completely

### Why This Matters
- Reduces cognitive load
- Simplifies navigation logic
- Improves long-term maintainability
- Prevents “which dashboard is current?” confusion

---

## 3️⃣ Intentional Authentication Preservation

### Important Note
Authentication is intentionally **not removed** during development.

Even when dev shortcuts exist:
- Auth pages remain functional
- Real auth flows remain testable
- Production readiness is preserved

This avoids costly refactors later and ensures security correctness.

---

## 4️⃣ Deferred Implementation Policy

All features listed here:
- Are **approved conceptually**
- Are **not blockers**
- Will be implemented only when core workflows stabilize

This document serves as an **architectural memory**, not an active task list.
