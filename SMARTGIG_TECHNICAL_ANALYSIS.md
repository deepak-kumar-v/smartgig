# Chapter 4 – Proposed Work Modules
## SmartGig Codebase Technical Analysis

---

# 1. SYSTEM MODULE IDENTIFICATION

The SmartGig system is architected into several tightly integrated modules, ensuring role-based access, financial integrity, and real-time operations.

* **Authentication & Profiles Module**
  * **Purpose:** Manages user identity, session persistence, and role isolation.
  * **Key Responsibilities:** Credential validation, JWT session management, RBAC (`FREELANCER`, `CLIENT`, `ADMIN`), and specialized profile routing.

* **Financial & Wallet Module (Decimal-Safe)**
  * **Purpose:** Handles deposits, withdrawals, and platform fee deductions.
  * **Key Responsibilities:** Append-only ledger maintenance, strict transactional balance aggregation, and idempotency guarantees.

* **Escrow & Ledger Module**
  * **Purpose:** Ensures secure, milestone-based holding and release of funds.
  * **Key Responsibilities:** Locking funds per milestone, refund processing, and protecting against double-spending or race conditions.

* **Contract & Milestone Management Module**
  * **Purpose:** Governs the lifecycle of freelance engagements via structured agreements.
  * **Key Responsibilities:** Enforcing Trial-first flows, strict sequential milestone progression, and immutable commission rate snapshotting.

* **Real-Time Communication Module**
  * **Purpose:** Enables instant messaging, file sharing, and call signaling between parties.
  * **Key Responsibilities:** WebSocket connection management, message persistence, delivery/read receipts, and editing with immutable version history.

* **Video Conferencing Module**
  * **Purpose:** Facilitates in-app video and audio calls with contract-bound security.
  * **Key Responsibilities:** Connecting peers via native WebRTC, generating Twilio Network Traversal Service (TURN) tokens, and tracking room lifecycles.

* **Dispute Resolution Module**
  * **Purpose:** Manages conflicts over milestones with structured arbitration.
  * **Key Responsibilities:** Enforcing structured dispute phases (Discussion -> Proposal -> Admin Review) and snapshotting state for untampered evidence.

---

# 2. DETAILED MODULE IMPLEMENTATION

### Authentication Module
* **Description:** Manages authentication utilizing NextAuth.js with a database-backed Prisma adapter.
* **Internal Workflow:** 
  1. User submits credentials or uses OAuth.
  2. The `authorize` callback strictly parses inputs via `zod`. Basic Auth uses `bcryptjs` for password verification. 
  3. `jwt` callback maps database roles into the token.
  4. Server actions invoke `auth()` to inject session logic.
* **Key Components / Functions:** `auth.ts`, `auth.config.ts`, `signIn()`, `signOut()`.
* **Data Interaction:** Reads `User`, `Account`, and `Session` tables.
* **Technologies Used:** NextAuth v5, bcryptjs, Zod, Prisma Adapter.

### Financial & Wallet Module
* **Description:** A fintech-grade wallet built entirely on appending transaction deltas, eliminating stored balances prone to drift.
* **Internal Workflow:** 
  1. A deposit invokes `depositFunds()`.
  2. Starts a `Serializable` database transaction.
  3. Generates a new `WalletLedger` row of type `DEPOSIT`. 
  4. Generates an idempotency record and a `FinancialMutationLog`.
* **Key Components / Functions:** `getWalletDashboardData()`, `depositFunds()`, `withdrawFunds()`.
* **Data Interaction:** Inserts into `WalletLedger` and `FinancialMutationLog`.
* **Technologies Used:** Prisma (`@db.Decimal`), PostgreSQL.

### Contract Management Module
* **Description:** Governs the agreement timeline and restricts unauthorized financial progress.
* **Internal Workflow:** 
  1. `createContractFromProposal` verifies `TRIAL` prerequisites.
  2. Contract moves from `DRAFT` to `PENDING_REVIEW` to `ACCEPTED`.
  3. Client executes `finalizeContract()`, which takes an immutable snapshot of the active commission rate from `SystemConfig`.
  4. Contract becomes `ACTIVE` only when escrow is funded (`FUNDED` status).
* **Key Components:** `createContractFromProposal()`, `finalizeContract()`, `startContract()`.
* **Data Interaction:** Modifies `Contract` and `Milestone` statuses.

---

# 3. FINANCIAL SYSTEM (VERY IMPORTANT – DEEP DIVE)

### Wallet System
The wallet avoids storing "current balance" directly to prevent desynchronization (drift). Instead, **balance is strictly derived on-the-fly via ledger aggregation**.
* **Formula:** `Available Balance = SUM(WalletLedger.amount) - SUM(Pending Withdrawals)`. 
* **Note:** Because an Escrow lock acts as a ledger debit (`ESCROW_LOCK` with negative amount), locks are implicitly deducted from available funds.

### Escrow System
Escrow splits the state into two core models:
* `EscrowAccount` sits at the `Contract` level.
* `EscrowLock` sits at the `Milestone` level.
When `fundMilestone()` executes, it calculates exactly how much is needed, verifies available balance dynamically, creates an `EscrowLock`, and creates an offsetting negative `WalletLedger` entry. Refunding simply reverses the lock by creating a `REFUND` ledger credit.

### Ledger Mechanism (Append-Only)
Database schemas prohibit standard `UPDATE` on balances. Every financial shift (Deposit, Fee, Lock, Release, Refund) requires generating a new `WalletLedger` row, creating an immutable audit trail.

### Transaction Safety
Database-level transactional safety guarantees are critical here. Escrow operations utilize `db.$transaction()` heavily, enforcing the strictest database isolation: `isolationLevel: 'Serializable'`. This forces concurrent funding or withdrawal requests on the same wallet to execute sequentially or fail, decisively removing race-condition/double-spend vulnerabilities.

### Idempotency
To prevent double execution caused by network retries, financial mutations receive an `idempotencyKey` parameter. The system inserts this key into the `IdempotencyKey` table within the same transaction. If an operation repeats, the unique constraint violates quietly, rejecting duplicate processing.

### Validation
Database fields are rigidly defined as `@db.Decimal(18,2)`. Functions use `Prisma.Decimal` exclusively for math (`amount.plus()`, `amount.minus()`), entirely avoiding JS floating-point inaccuracies. Amounts are asserted `.isPositive()` natively before executing any ledger queries.

---

# 4. CONTRACT SYSTEM

* **Trial-based Contract Workflow:** Enforces a mitigation layer for uncertainty. If a job allows for Trial Tasks, the system restricts the `FULL` contract's creation until a localized `TRIAL` contract is fully `COMPLETED` and paid out.
* **Standard Contract Workflow:** Built on sequential lifecycle boundaries. After a proposal, the Draft is iteratively reviewed and modified. Once accepted, it locks the `commissionRate`.
* **Milestone Handling:** Milestones are strictly ordered utilizing a `sequence` parameter. The `fundMilestone()` architecture prevents milestone #2 from being funded until milestone #1 is mathematically resolved (`PAID`). 

---

# 5. REAL-TIME COMMUNICATION SYSTEM

* **Chat System Workflow:** `Socket.IO` wraps the communication layer. Users join specific rooms mapped to `conversation:{id}`. The client publishes messages, triggering server-side database writing before broadcasting updates downward.
* **Socket.IO Event Handling:** Events like `send-message`, `typing:start`, `message:read`, and `message:react` are intercepted by `socket-server.ts`. 
* **Message Persistence Strategy:** A message traverses the socket, hits a Prisma `create` query pushing directly to `Message` while simultaneously writing out associated `Attachment` tables. It utilizes an advanced `MessageVersion` system for immutable editing (each message amendment creates a new version trace instead of overwriting).
* **Delivery Status Pipeline:** Connection logs update user sockets; unread badges are fetched per socket broadcast using `markConversationDeliveredForUser`.

---

# 6. VIDEO COMMUNICATION SYSTEM

* **WebRTC Signaling Flow:** SmartGig opts for native WebRTC implementations transmitted over its pre-existing WebSocket configuration rather than an external Jitsi iFrame. State calls like `call:offer`, `call:answer`, and `call:ice-candidate` pass WebRTC `RTCSessionDescriptionInit` blobs back and forth via `socket-server.ts` to coordinate direct peer-to-peer tunnels.
* **Role of TURN/ICE (Twilio):** To conquer NAT firewalls, the app hooks into the `/api/webrtc/turn` endpoint. It invokes a `twilio()` client utilizing credentials to systematically generate short-lived Network Traversal Service (`client.tokens.create()`) authentication tokens, issuing reliable ICE server arrays down to the client peers.

---

# 7. SECURITY IMPLEMENTATION

* **Authentication:** Orchestrated with `NextAuth`, segregating credential parsing and OAuth configurations securely on the backend, ensuring zero access leakage between roles.
* **Authorization (RBAC):** Every server action enforces structural role guardrails (e.g., `if (session.user.role !== "CLIENT") throw Error;`). Validation checks if a user technically maps to the relevant `Profile` associated with specific resources.
* **Validation (Zod):** Deep parameter checking via strong schemas across form endpoints truncates injection or malformed payload attacks.
* **Secure Financial Handlers:** Uses atomic transactions. It specifically leverages "Wallet-First" structures, forcing deposits first, then escrow locks—rendering balance overrides completely impossible. Financial modifications immediately export duplicate `FinancialMutationLog` and `AuditLog` snapshots.

---

# 8. DATABASE DESIGN (STRUCTURAL)

* **Key Entities:** `User`, `ClientProfile`, `FreelancerProfile`, `JobPost`, `Contract`, `Milestone`, `EscrowAccount`, `Wallet`, `WalletLedger`.
* **Relationships:**
    * `User` 1:1 with `Wallet` and Role Profiles.
    * `Contract` 1:N with `Milestone`.
    * `Contract` 1:1 with `EscrowAccount`.
    * `EscrowAccount` 1:N with `EscrowLock` (linked to `Milestone` dynamically via `milestoneId`).
    * `Wallet` 1:N with `WalletLedger`.
* **Critical Fields:**
    * `commissionRate Decimal @db.Decimal(5, 4)` (Mutable only up to the finalized snapshot).
    * `amount Decimal @db.Decimal(18, 2)` (Uniform configuration across all financial columns).

---

# 9. UNIQUE / ADVANCED FEATURES

* **Algorithmic Ledger Construction:** The sheer absence of a `balance` column on the user's wallet table ensures pure ledger traceability. This drastically reduces attack vectors related to unsynchronized DB rows during scaling.
* **Strict Sequential Milestone Escalation:** Rather than simply checking arrays, the transactional pipeline checks positional database offsets. Next milestones are mathematically blocked from funding logic until an exact relational loop finishes.
* **Immutable Auditing with Version Constraints:** Message edits push row arrays instead of text overwrites via the `MessageVersion` entity, preserving cryptographic histories (`contentHash` SHA-256 integrations for tamper-evident data logic during legal disputes).
* **Double-Lock Escrow Prevention:** Implementing pre-checks inside the `Serializable` transaction loop physically eradicates duplicate escrow attempts over simultaneous connections.
