# 1. MODULE-WISE FILE STRUCTURE

*   **Authentication Module**
    *   `src/lib/auth.ts`: Configuration for NextAuth, credentials provider callbacks, and strict token generation.
    *   `src/lib/auth.config.ts`: Base middleware-safe configuration array mapping authentication endpoints.
*   **Contract Management Module**
    *   `src/actions/contract-actions.ts`: Core server actions handling contract workflows (Draft, Finalization, Activation).
    *   `src/actions/milestone-actions.ts`: Server actions managing milestone submissions and client approvals.
*   **Financial & Escrow Module**
    *   `src/actions/wallet-actions.ts`: Ledger-based wallet logic handling aggregation, deposits, and withdrawal validations.
    *   `src/actions/escrow-actions.ts`: Transactional logic for base escrow funding and precise milestone locking.
    *   `src/actions/escrow-release-actions.ts`: Logic transferring internal Escrow Locks to external Wallet Ledgers.
    *   `src/lib/escrow-integrity.ts`: Verification functions asserting total systemic Escrow Locks match Escrow Account balances.
*   **Communication & Chat Module**
    *   `socket-server.ts`: Custom Native Socket.IO wrapper managing chat rooms, versioned messaging, and WebRTC handshakes.
    *   `src/actions/chat-upload-actions.ts`: Isolated Node `fs/promises` handlers saving chat attachments safely.
*   **Dispute & Arbitration Module**
    *   `src/actions/dispute-actions.ts`: Instantiation of dispute trails, proposals, and automated settlement thresholds.
    *   `src/actions/admin-dispute-actions.ts`: Higher-privilege resolution actions forcing ledger dispersals on deadlocks.

---

# 2. FUNCTION / ACTION IDENTIFICATION

*   **Authentication Module**
    *   `authorize()`: Strictly parses username/passwords via bcrypt and prevents unauthorized entry.
    *   `jwt()`: Refreshes security payload matching users to specific database profiles.
*   **Contract Management Module**
    *   `createContractFromProposal()`: Translates client-approved `JobPost` proposals directly into `DRAFT` contracts.
    *   `finalizeContract()`: Irreversibly snapshots dynamic framework constants like `commissionRate` over to static contract memory.
    *   `startContract()`: Final milestone handshake allowing a `FUNDED` contract to safely spin to `ACTIVE`.
*   **Financial & Escrow Module**
    *   `getWalletDashboardData()`: Read-only DB logic grouping all `WalletLedger` elements natively via aggregate queries.
    *   `depositFunds()`: Initiates an idempotent, isolated Prisma SQL `$transaction` appending new funds.
    *   `fundEscrow()`: Secures core `EscrowAccount` existence checks before generating milestone-locked ledgers.
    *   `fundMilestone()`: Seizes wallet ledger values, verifies availability recursively, and anchors them into sequential `EscrowLock` hashes.
*   **Communication Module**
    *   `uploadChatAttachment()`: Uploads buffers handling explicit blocked filetypes logic for socket chat injections.
*   **Dispute Module**
    *   `openDispute()`: Validates milestone stages, constructs an immutable JSON string snapshotted state, and invokes an `SHA-256` content hash.
    *   `submitProposal()`: Validates counter-offer integers, checks mutual threshold overlap, and triggers execution.
    *   `requestPhaseTransition()`: Flips boolean markers dictating mutual negotiation bypass.

---

# 3. BACKEND LOGIC ENTRY POINTS

*   **Authentication**: Primary entry falls to `/api/auth/[...nextauth]/route.ts` bridging `NextAuth()` configuration.
*   **Contract Handling**: Executed primarily natively within `src/actions/contract-actions.ts` via `'use server'` React 19 directives.
*   **Escrow / Wallet Operations**: Routed distinctly through `src/actions/wallet-actions.ts` and `src/actions/escrow-actions.ts` ensuring tight financial API borders.
*   **Messaging**: Driven via Node HTTP events intercepting `socket.io/connection` within `socket-server.ts`. 
*   **Disputes**: Handled directly through isolated forms pinging `src/actions/dispute-actions.ts` strictly bound with DB `.transaction()` layers.

---

# 4. DATABASE INTERACTION POINTS

*   **Authentication Module**
    *   *Database Interactions:* `findUnique({ where: { email } })` inside validations, token mutations.
    *   *Models Used:* `User`, `Account`, `Session`
*   **Contract Management Module**
    *   *Database Interactions:* `contract.create()`, `contract.update()`, `systemConfig.findFirst()`
    *   *Models Used:* `Contract`, `Milestone`, `ClientProfile`, `SystemConfig`, `Proposal`
*   **Financial & Escrow Module**
    *   *Database Interactions:* `db.$transaction()` generating new items mathematically linked to `$aggregate()`.
    *   *Models Used:* `Wallet`, `WalletLedger`, `EscrowAccount`, `EscrowLock`, `IdempotencyKey`, `FinancialMutationLog`
*   **Communication Module**
    *   *Database Interactions:* Read/writes attached to `socket.on()` handlers persisting message histories sequentially.
    *   *Models Used:* `Conversation`, `Message`, `MessageVersion`, `Attachment`
*   **Dispute Module**
    *   *Database Interactions:* Read snapshot extractions converting rows to JSON fields via `dispute.create()`.
    *   *Models Used:* `Dispute`, `DisputeMessage`, `DisputeProposal`, `DisputeEvidence`, `Milestone`, `Contract`
