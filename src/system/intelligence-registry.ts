/**
 * FINANCIAL GOVERNANCE DIRECTIVE:
 *
 * Before modifying:
 * - Wallet
 * - WalletLedger
 * - EscrowAccount
 * - EscrowLock
 * - WithdrawalRequest
 * - Commission logic
 * - validate-finance.ts
 * - schema.prisma financial models
 *
 * AI IDE MUST read:
 * docs/financial-system-maturity.md
 *
 * Any financial mutation without reviewing that document
 * is a governance violation.
 */
/**
 * SYSTEM RULE:
 * Any feature upgrade MUST update this registry.
 * AI IDE must read /docs/system-intelligence-directive.md
 * before modifying financial, contract, messaging, or system architecture.
 *
 * This file is the SINGLE SOURCE OF TRUTH for page-level intelligence.
 * Removing metadata is forbidden. Outdated metadata is a system integrity failure.
 */

// ============================================================================
// System Version
// ============================================================================

export const SYSTEM_INTELLIGENCE_VERSION = '1.0.0';

// ============================================================================
// Page Domain Classification
// ============================================================================

export enum PageDomain {
    FINANCIAL = 'FINANCIAL',
    MESSAGING = 'MESSAGING',
    CONTRACT = 'CONTRACT',
    JOBS = 'JOBS',
    ADMIN = 'ADMIN',
    GENERIC = 'GENERIC',
}

// ============================================================================
// Tab Types
// ============================================================================

export type IntelligenceTab =
    | 'CURRENT_PAGE'
    | 'FINANCIAL_CORE'
    | 'ATTACK_DEFENSE'
    | 'TRANSACTION_MAP'
    | 'OPERATIONAL_HARDENING'
    | 'REVENUE_MODEL'
    | 'SYSTEM_DIAGRAMS'
    | 'SCALE_HARDENING';

// ============================================================================
// Metadata Interface — Strict, Versioned
// ============================================================================

export interface PageIntelligenceMeta {
    route: string;
    domain: PageDomain;

    version: string;
    lastUpdated: string;

    description: string;

    currentPage?: {
        capabilities?: string[];
        features?: string[];
        safeguards?: string[];
        edgeCases?: string[];
        dependencies?: string[];
        stateManagement?: string[];
        accessControl?: string[];
    };

    financialCore?: {
        safeguards?: string[];
        invariants?: string[];
        concurrencyModel?: string;
    };

    attackDefense?: string[];

    transactionMap?: string[];

    operationalHardening?: string[];

    revenueModel?: string[];

    scaleHardening?: string[];

    systemDiagrams?: {
        ascii?: string;
    };

    inheritsFrom?: string;
}

// ============================================================================
// Metadata-Driven Tab Resolution — No Static Domain Map
// ============================================================================

export function getVisibleTabs(meta: PageIntelligenceMeta): IntelligenceTab[] {
    let tabs: IntelligenceTab[] = ['CURRENT_PAGE'];

    if (meta.financialCore) tabs.push('FINANCIAL_CORE');
    if (meta.attackDefense) tabs.push('ATTACK_DEFENSE');
    if (meta.transactionMap) tabs.push('TRANSACTION_MAP');
    if (meta.operationalHardening) tabs.push('OPERATIONAL_HARDENING');
    if (meta.revenueModel) tabs.push('REVENUE_MODEL');
    if (meta.scaleHardening) tabs.push('SCALE_HARDENING');
    if (meta.systemDiagrams) tabs.push('SYSTEM_DIAGRAMS');

    // Domain guard: strip financial-only tabs from MESSAGING defensively
    if (meta.domain === PageDomain.MESSAGING) {
        tabs = tabs.filter(tab =>
            tab !== 'FINANCIAL_CORE' &&
            tab !== 'REVENUE_MODEL' &&
            tab !== 'SCALE_HARDENING'
        );
    }

    return tabs;
}

// ============================================================================
// Registry
// ============================================================================

const registry: Record<string, PageIntelligenceMeta> = {};

function register(meta: PageIntelligenceMeta): void {
    registry[meta.route] = meta;
}

export function resolvePageIntelligence(pathname: string): PageIntelligenceMeta | null {
    return registry[pathname] ?? null;
}

export function getRegisteredRoutes(): string[] {
    return Object.keys(registry);
}

/**
 * Read-only snapshot of the registry for governance validation.
 * Entries are deep-frozen — no mutation possible through this accessor.
 */
export function getRegistrySnapshot(): Readonly<Record<string, PageIntelligenceMeta>> {
    return registry;
}

/**
 * Resolve metadata with explicit inheritance.
 * 1. Exact match only.
 * 2. If inheritsFrom is set, merge parent into child.
 * 3. Arrays: parent first, then child (concatenate).
 * 4. Objects: shallow merge (child overrides).
 * 5. Scalars: child overrides.
 * 6. Does NOT mutate registry.
 */
export function resolveWithInheritance(pathname: string): PageIntelligenceMeta | null {
    const meta = registry[pathname];
    if (!meta) return null;

    if (!meta.inheritsFrom) return meta;

    const parent = registry[meta.inheritsFrom];
    if (!parent) return meta;

    return mergeMeta(parent, meta);
}

function mergeStringArrays(
    parentArr: string[] | undefined,
    childArr: string[] | undefined
): string[] | undefined {
    if (!parentArr && !childArr) return undefined;
    return [...(parentArr ?? []), ...(childArr ?? [])];
}

function mergeMeta(
    parent: PageIntelligenceMeta,
    child: PageIntelligenceMeta
): PageIntelligenceMeta {
    const merged: PageIntelligenceMeta = {
        // Scalars — child overrides
        route: child.route,
        domain: child.domain,
        version: child.version,
        lastUpdated: child.lastUpdated,
        description: child.description,
        inheritsFrom: child.inheritsFrom,

        // currentPage — shallow merge, arrays concatenate
        currentPage: (parent.currentPage || child.currentPage) ? {
            capabilities: mergeStringArrays(parent.currentPage?.capabilities, child.currentPage?.capabilities),
            features: mergeStringArrays(parent.currentPage?.features, child.currentPage?.features),
            safeguards: mergeStringArrays(parent.currentPage?.safeguards, child.currentPage?.safeguards),
            edgeCases: mergeStringArrays(parent.currentPage?.edgeCases, child.currentPage?.edgeCases),
            dependencies: mergeStringArrays(parent.currentPage?.dependencies, child.currentPage?.dependencies),
            stateManagement: mergeStringArrays(parent.currentPage?.stateManagement, child.currentPage?.stateManagement),
            accessControl: mergeStringArrays(parent.currentPage?.accessControl, child.currentPage?.accessControl),
        } : undefined,

        // financialCore — shallow merge
        financialCore: (parent.financialCore || child.financialCore) ? {
            safeguards: mergeStringArrays(parent.financialCore?.safeguards, child.financialCore?.safeguards),
            invariants: mergeStringArrays(parent.financialCore?.invariants, child.financialCore?.invariants),
            concurrencyModel: child.financialCore?.concurrencyModel ?? parent.financialCore?.concurrencyModel,
        } : undefined,

        // Top-level arrays — concatenate
        attackDefense: mergeStringArrays(parent.attackDefense, child.attackDefense),
        transactionMap: mergeStringArrays(parent.transactionMap, child.transactionMap),
        operationalHardening: mergeStringArrays(parent.operationalHardening, child.operationalHardening),
        revenueModel: mergeStringArrays(parent.revenueModel, child.revenueModel),
        scaleHardening: mergeStringArrays(parent.scaleHardening, child.scaleHardening),

        // systemDiagrams — child overrides
        systemDiagrams: child.systemDiagrams ?? parent.systemDiagrams,
    };

    return merged;
}

// ============================================================================
// CLIENT WALLET
// ============================================================================

register({
    route: '/client/wallet',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Ledger-derived wallet dashboard for clients. No stored balance column — every number computed from WalletLedger.',

    currentPage: {
        capabilities: [
            'View ledger-derived balance (available, locked, pending withdrawal)',
            'Deposit funds via depositToWallet action',
            'Navigate to withdrawal request page',
            'View paginated transaction history (last 100)',
        ],
        features: [
            'Available = SUM(ledger) - SUM(unreleased locks) - SUM(pending withdrawals)',
            'Locked amount derived from EscrowLock WHERE released = false',
            'Pending withdrawal derived from WithdrawalRequest WHERE status = PENDING',
            'Transaction list ordered by createdAt DESC, take: 100',
            'Deposit action creates DEPOSIT type WalletLedger entry',
        ],
        safeguards: [
            'Deposit amount validated as positive Prisma.Decimal',
            'Idempotency key prevents duplicate deposits (IdempotencyKey table)',
            'Serializable isolation on deposit transaction',
            'FinancialMutationLog appended inside tx on deposit',
            'FinancialErrorLog appended (fire-and-forget) on failure',
        ],
        edgeCases: [
            'New user with zero transactions: all aggregates return 0',
            'Concurrent deposits serialized at DB level',
        ],
        dependencies: ['wallet-actions.ts', 'escrow-data-actions.ts', 'withdrawal-actions.ts'],
        accessControl: ['Session required', 'User can only access own wallet'],
    },

    financialCore: {
        safeguards: [
            'No stored balance — derived from ledger',
            'IdempotencyKey inside tx guarantees atomic duplicate rejection',
        ],
        invariants: [
            'Available = SUM(ledger) - locked - pending',
            'Deposit creates exactly one DEPOSIT ledger entry per idempotency key',
        ],
        concurrencyModel: 'Serializable isolation on deposit. Read queries use default isolation.',
    },

    attackDefense: [
        'Double deposit: IdempotencyKey @@unique constraint rejects replay',
        'Negative deposit: Amount validated positive before tx entry',
        'Stale balance: No stored balance — derived every read',
    ],

    transactionMap: [
        'depositToWallet: Serializable | re-fetches wallet | asserts amount > 0 | logs MutationLog(amount) | idempotency key guard',
    ],

    revenueModel: [
        'Deposits do not generate platform revenue — revenue comes from PLATFORM_FEE on milestone release',
    ],

    scaleHardening: [
        'Transaction list uses [walletId, createdAt↓] index',
        'Locked amount query uses [escrowId, released] index',
        'Pending withdrawal uses [userId, status] index',
        'Transaction list bounded: take: 100',
    ],

    systemDiagrams: {
        ascii: `  Client ── depositToWallet() ── Serializable Tx
                                  ├─ walletLedger.create(DEPOSIT, +amount)
                                  ├─ idempotencyKey.create (unique guard)
                                  └─ mutationLog.create
       On error: errorLog.create (fire-and-forget)`,
    },
});

// ============================================================================
// FREELANCER WALLET
// ============================================================================

register({
    route: '/freelancer/wallet',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer earnings dashboard. Shows NET payout (after commission). Commission details visible in escrow panel, not wallet.',

    currentPage: {
        capabilities: [
            'View ledger-derived balance (available, locked, pending withdrawal)',
            'Navigate to withdrawal request page',
            'View paginated transaction history (last 100)',
        ],
        features: [
            'Available = SUM(ledger) - SUM(unreleased locks) - SUM(pending withdrawals)',
            'Freelancer sees ESCROW_RELEASE entries (net payout only)',
            'PLATFORM_FEE entries go to platform wallet, not freelancer',
        ],
        safeguards: [
            'Balance derivation identical formula to client wallet',
            'Pending withdrawals subtracted from available',
        ],
        edgeCases: [
            'Freelancer with zero earnings: aggregates return 0',
            'Concurrent withdrawal requests serialized at DB level',
        ],
        dependencies: ['wallet-actions.ts', 'withdrawal-actions.ts'],
        accessControl: ['Session required', 'Freelancer role only', 'Own wallet only'],
    },

    financialCore: {
        invariants: ['Available = SUM(ledger) - locked - pending'],
        concurrencyModel: 'Read-only page. Withdrawal uses Serializable isolation.',
    },

    attackDefense: [
        'Over-withdrawal: requestWithdrawal validates amount <= available inside Serializable tx',
        'Cross-user access: auth() + userId scoping on all queries',
    ],

    scaleHardening: [
        'Indexed [walletId, createdAt↓] for transaction listing',
        'Indexed [userId, status] for pending withdrawal derivation',
        'Transaction list bounded: take: 100',
    ],
});

// ============================================================================
// WITHDRAWAL REQUEST PAGE
// ============================================================================

register({
    route: '/freelancer/wallet/withdraw',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Withdrawal request form. Amount validated against ledger-derived available balance re-derived INSIDE the Serializable transaction.',

    currentPage: {
        capabilities: ['Submit withdrawal request', 'View current available balance'],
        features: [
            'Amount validated: positive and <= available',
            'Available re-derived inside tx: SUM(ledger) - locked - otherPending',
            'Creates WithdrawalRequest with status PENDING',
            'No ledger mutation until admin approval',
        ],
        safeguards: [
            'Amount validated server-side',
            'Balance re-derived INSIDE Serializable tx',
            'Other pending withdrawals subtracted from available',
        ],
        edgeCases: [
            'Request exactly equal to available: allowed',
            'Request while another pending: available already reduced',
        ],
        dependencies: ['withdrawal-actions.ts'],
        stateManagement: ['Form state client-side', 'Balance fetched server-side on load'],
        accessControl: ['Session required', 'Freelancer role'],
    },

    financialCore: {
        invariants: ['available = total - locked - otherPending'],
        concurrencyModel: 'Serializable. Concurrent requests serialized — second sees updated pending.',
    },

    attackDefense: [
        'Double-spend via concurrent requests: Serializable isolation at DB level',
        'Negative amount: server-side positive validation',
        'Exceeding balance: in-tx re-derivation catches stale amounts',
        'Pending withdrawal double-spend: otherPending subtracted inside tx',
    ],

    transactionMap: [
        'requestWithdrawal: Serializable | re-derives available | validates amount | creates WithdrawalRequest(PENDING) | logs MutationLog',
    ],

    scaleHardening: [
        'Pending withdrawal query uses [userId, status] index',
    ],
});

// ============================================================================
// CONTRACT
// ============================================================================

register({
    route: '/client/contracts/[contractId]',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Contract detail view. Milestones, escrow, financial timeline, deliverables. Clients fund/release/refund. Freelancers submit deliverables.',

    currentPage: {
        capabilities: [
            'View contract details, milestones, escrow status',
            'Fund escrow (client only)',
            'Release milestone funds (client only)',
            'Approve trial work (client only)',
            'Refund escrow (client only)',
            'Submit deliverables (freelancer only)',
            'View financial timeline per milestone',
        ],
        features: [
            'Escrow panel: total funded, released, unreleased, platform fees',
            'Commission breakdown: freelancerPayout + commissionAmount = lockAmount',
            'Financial timeline: WalletLedger entries scoped by milestoneId',
            'Milestone status badges',
            'Commission rate from contract.commissionRate (immutable snapshot)',
        ],
        safeguards: [
            'fundEscrow: in-tx contract/escrow re-fetch, escrow existence guard',
            'releaseMilestoneFunds: in-tx lock re-fetch, lock.released guard, COMMISSION_SPLIT assertion',
            'approveTrialWork: in-tx milestone status re-check',
            'refundEscrow: only unreleased locks (released=false) refunded',
            'assertEscrowIntegrity called in every release/refund/fund tx',
            'assertDecimalNonNegative on commission and payout',
        ],
        edgeCases: [
            'Already-released milestone: lock.released guard prevents double-release',
            'Contract with zero milestones: escrow cannot be funded',
        ],
        dependencies: ['escrow-actions.ts', 'escrow-release-actions.ts', 'trial-actions.ts', 'contract-financial-actions.ts'],
        accessControl: ['Client: fund/release/refund/approve', 'Freelancer: submit deliverables', 'Both: view details'],
    },

    financialCore: {
        safeguards: [
            'assertEscrowIntegrity after every escrow mutation',
            'COMMISSION_SPLIT_INCONSISTENT assertion on release',
            'assertDecimalNonNegative on payout and commission',
        ],
        invariants: [
            'expectedUnreleased = |ESCROW_LOCK| - ESCROW_RELEASE - PLATFORM_FEE - REFUND',
            'freelancerPayout + commissionAmount = lockAmount (exact)',
            'One EscrowAccount per contract (@@unique[contractId])',
            'One EscrowLock per milestone (@@unique[escrowId, milestoneId])',
        ],
        concurrencyModel: 'All mutations use Serializable isolation.',
    },

    attackDefense: [
        'Double release: lock.released === true check inside Serializable tx',
        'Double funding: escrowAccount existence check inside tx',
        'Commission manipulation: commissionRate immutable after FINALIZED',
        'Race on trial approval: milestone status re-fetched inside tx',
        'Refund + release collision: only unreleased locks eligible',
    ],

    transactionMap: [
        'fundEscrow: Serializable | re-fetches contract+escrow | creates locks per milestone | ESCROW_LOCK ledger | assertEscrowIntegrity | MutationLog',
        'releaseMilestoneFunds: Serializable | re-fetches lock+contract | commission split | ESCROW_RELEASE + PLATFORM_FEE | assertEscrowIntegrity | MutationLog',
        'refundEscrow: Serializable | re-fetches escrow+locks | REFUND ledger | flip lock.released | assertEscrowIntegrity | MutationLog',
        'approveTrialWork: Serializable | re-fetches milestone+lock | commission split | ESCROW_RELEASE + PLATFORM_FEE | MutationLog',
    ],

    revenueModel: [
        'Commission deducted from freelancer payout on release',
        'PLATFORM_FEE ledger entry → platform wallet',
        'Client pays: full lockAmount',
        'Freelancer receives: lockAmount × (1 - commissionRate)',
        'Platform receives: lockAmount × commissionRate',
    ],

    scaleHardening: [
        'Financial timeline uses [milestoneId, type] index',
        'Escrow lock queries use [escrowId, released] index',
    ],

    systemDiagrams: {
        ascii: `  Fund:    client → fundEscrow → tx { locks + ESCROW_LOCK ledger + integrity }
  Release: client → releaseMilestoneFunds → tx { split + ESCROW_RELEASE + PLATFORM_FEE + integrity }
  Refund:  client → refundEscrow → tx { REFUND ledger + flip locks + integrity }`,
    },
});

// ============================================================================
// MESSAGING (CLIENT)
// ============================================================================

register({
    route: '/client/messages',
    domain: PageDomain.MESSAGING,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Real-time messaging with conversation isolation, edit history, audio/video, file attachments.',

    currentPage: {
        capabilities: [
            'Send and receive real-time messages via Pusher',
            'View conversation list with unread counts',
            'Initiate video calls (WebRTC via LiveKit)',
            'Send audio messages',
            'Upload file attachments',
            'Edit and delete messages (version history tracked)',
        ],
        features: [
            'Real-time delivery via Pusher WebSocket',
            'Unread badge system: per-conversation unread count',
            'New message divider between read and unread',
            'Message status lifecycle: SENT → DELIVERED → READ',
            'Conversation isolation: one conversation per contract',
            'Message edit tracking: MessageVersion with SHA-256 hash',
            'Emoji reactions (@@unique[messageId, userId])',
        ],
        safeguards: [
            'Conversation scoped to contract participants only',
            'Message author verification on edit/delete',
            'File upload size and type validation (backend enforced)',
            'Message version audit trail (append-only MessageVersion)',
        ],
        edgeCases: [
            'User offline: messages delivered on Pusher reconnect',
            'Simultaneous edits: last-write-wins',
            'Empty conversation: shows prompt',
        ],
        dependencies: ['message-actions.ts', 'pusher-config.ts', 'use-chat.ts'],
        stateManagement: [
            'useChat hook manages message state client-side',
            'Pusher subscription syncs incoming messages',
            'Optimistic UI for sent messages',
        ],
        accessControl: ['Only contract participants can access conversation'],
    },

    attackDefense: [
        'Cross-conversation access: userId + contractId scoping',
        'Message impersonation: senderId verified against session',
        'File upload abuse: backend validation of size and MIME type',
        'Replay attack prevention: message write bound to authenticated session',
        'Unauthorized contract access blocked by contractId + userId scoping',
        'Version tampering prevented by append-only MessageVersion model',
        'Reaction duplication prevented via @@unique(messageId, userId)',
    ],

    systemDiagrams: {
        ascii: `  Messaging Flow:
  User → sendMessage()
        → Server Action
        → DB insert (Message)
        → Pusher trigger
        → Receiver client update

  Edit Flow:
  User → editMessage()
        → new MessageVersion (append-only)
        → original message updated
        → audit retained

  Security Boundary:
  Session → contract participant check → message access`,
    },
});

// ============================================================================
// MESSAGING (FREELANCER)
// ============================================================================

register({
    route: '/freelancer/messages',
    domain: PageDomain.MESSAGING,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer messaging interface. Same capabilities as client messaging — conversation isolation by contract.',

    currentPage: {
        capabilities: [
            'Send and receive real-time messages',
            'View conversations with unread counts',
            'Initiate video calls',
            'Send audio messages and file attachments',
            'Edit and delete messages with version tracking',
        ],
        features: [
            'Same feature set as client messaging',
            'Conversation scoped to contracts where user is freelancer',
        ],
        safeguards: [
            'Conversation scoped to contract participants',
            'Message author verification on edit/delete',
        ],
        dependencies: ['message-actions.ts', 'pusher-config.ts', 'use-chat.ts'],
        accessControl: ['Freelancer can only access own contract conversations'],
    },

    attackDefense: [
        'Cross-conversation access: userId + contractId scoping',
        'Message impersonation: senderId verified against session',
        'Replay attack prevention: message write bound to authenticated session',
        'Unauthorized contract access blocked by contractId + userId scoping',
        'Version tampering prevented by append-only MessageVersion model',
        'Reaction duplication prevented via @@unique(messageId, userId)',
    ],

    systemDiagrams: {
        ascii: `  Messaging Flow:
  User → sendMessage()
        → Server Action
        → DB insert (Message)
        → Pusher trigger
        → Receiver client update

  Edit Flow:
  User → editMessage()
        → new MessageVersion (append-only)
        → original message updated
        → audit retained

  Security Boundary:
  Session → contract participant check → message access`,
    },
});

// ============================================================================
// ADMIN DIAGNOSTICS
// ============================================================================

register({
    route: '/admin/financial-diagnostics',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Operational observability dashboard. Mutation logs, error logs, withdrawal snapshot, escrow health scanner, anomaly detector. All read-only.',

    currentPage: {
        capabilities: [
            'View last 50 financial mutation log entries',
            'View last 50 financial error log entries (expandable stack traces)',
            'View withdrawal snapshot (pending count, total amount, oldest)',
            'Run escrow health check (batched, max 200)',
            'Run financial anomaly scan (5 deterministic checks)',
        ],
        features: [
            'Mutation log: action, userId, contractId, milestoneId, metadata, timestamp',
            'Error log: action, errorMessage, stackTrace, timestamp',
            'Withdrawal snapshot: pending count, SUM(pending), oldest timestamp',
            'Escrow health: per-escrow assertEscrowIntegrity in Serializable read-only tx',
            'Anomaly: negative wallets, escrow mismatches, orphan PLATFORM_FEE, invalid commissionRate, duplicate SYSTEM users',
        ],
        safeguards: [
            'Admin-only access (requireAdmin() on every action)',
            'All queries bounded (take: 50 for logs, take: 200 for escrow scan)',
            'No write operations from any action on this page',
        ],
        dependencies: ['admin-diagnostic-actions.ts', 'admin-anomaly-actions.ts'],
        accessControl: ['Admin role required', 'Non-admin gets {error: "Unauthorized"}'],
    },

    operationalHardening: [
        'FinancialMutationLog: append-only, inside Serializable tx, never updated/deleted',
        'FinancialErrorLog: append-only, fire-and-forget outside tx',
        'Escrow health scanner: batched (limit=200), ordered by createdAt',
        'Anomaly detector: 5 deterministic checks, all queries bounded',
    ],

    scaleHardening: [
        'Mutation log uses [createdAt↓] index',
        'Error log uses [createdAt↓] index',
        'Withdrawal snapshot uses [status, createdAt] index',
        'Mutations bounded: take: 50',
        'Errors bounded: take: 50',
        'Escrow scan: take: 200',
    ],

    attackDefense: [
        'Read-only admin actions — no mutation',
        'All scans bounded to prevent memory exhaustion',
        'Serializable read isolation prevents partial state visibility',
    ],

    systemDiagrams: {
        ascii: `  Escrow Health Scan:
  for each escrow (limit=200):
      → Serializable read tx
      → assertEscrowIntegrity()

  Anomaly Detector:
  Check 1: negative wallets
  Check 2: escrow mismatch
  Check 3: orphan PLATFORM_FEE
  Check 4: invalid commissionRate
  Check 5: duplicate SYSTEM users

  All queries bounded.
  No writes performed.`,
    },
});

// ============================================================================
// ADMIN WITHDRAWALS
// ============================================================================

register({
    route: '/admin/withdrawals',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Withdraw management. Approve creates WITHDRAWAL ledger entry. Reject flips status only.',

    currentPage: {
        capabilities: [
            'View pending withdrawal requests',
            'Approve withdrawal (creates WITHDRAWAL ledger entry)',
            'Reject withdrawal (status change, no ledger mutation)',
        ],
        safeguards: [
            'approveWithdrawal: re-derives balance inside Serializable tx',
            'approveWithdrawal: subtracts OTHER pending withdrawals from available',
            'approveWithdrawal: post-debit assertion (available >= 0)',
            'rejectWithdrawal: in-tx status re-fetch prevents race',
        ],
        dependencies: ['withdrawal-actions.ts'],
        accessControl: ['Admin role required'],
    },

    financialCore: {
        invariants: [
            'Approval: WITHDRAWAL ledger entry created atomically with status update',
            'available = total - locked - otherPending >= withdrawalAmount',
        ],
        concurrencyModel: 'Serializable for both approve and reject.',
    },

    attackDefense: [
        'Double approval: in-tx status check — only PENDING approved',
        'Concurrent approve/reject: Serializable serializes at DB level',
        'Balance manipulation: fully re-derived inside tx',
        'Cross-admin race serialized by DB isolation',
        'Post-debit assertion prevents negative available balance',
        'Balance fully derived from ledger, not cached value',
    ],

    transactionMap: [
        'approveWithdrawal: Serializable | re-fetches request+wallet+balance+otherPending | WITHDRAWAL ledger | postDebit >= 0 | MutationLog',
        'rejectWithdrawal: Serializable | re-fetches status | update REJECTED | MutationLog',
    ],

    scaleHardening: [
        'Pending requests use [status, createdAt] index',
        'Per-user balance uses [walletId, createdAt↓] index',
    ],

    systemDiagrams: {
        ascii: `  Admin → approveWithdrawal()
         → Serializable tx
             → re-derive available balance
             → subtract otherPending
             → assert available >= amount
             → create WITHDRAWAL ledger entry
             → update request status
             → append MutationLog
         → commit

  On error:
    → append FinancialErrorLog (fire-and-forget)`,
    },
});

// ============================================================================
// ADMIN FINANCIAL OVERVIEW
// ============================================================================

register({
    route: '/admin/financial-overview',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Platform-wide financial metrics: volume by type, platform revenue, revenue by month/contract. Read-only.',

    currentPage: {
        capabilities: [
            'View total volume by WalletTransactionType',
            'View total platform revenue (SUM of PLATFORM_FEE)',
            'View revenue by month',
            'View revenue by contract',
        ],
        safeguards: ['Admin-only access', 'Platform fee entries bounded (take: 1000)'],
        dependencies: ['admin-financial-actions.ts'],
        accessControl: ['Admin role required'],
    },

    revenueModel: [
        'Platform revenue = SUM(PLATFORM_FEE ledger entries)',
        'Revenue by month: YYYY-MM grouped, sorted newest first',
        'Revenue by contract: linked to title, sorted highest first',
    ],

    scaleHardening: [
        'PLATFORM_FEE uses [type, createdAt↓] index',
        'Entries bounded: take: 1000',
    ],
});

// ============================================================================
// JOBS
// ============================================================================

register({
    route: '/freelancer/find-work',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Job discovery page. Freelancers browse available jobs. No financial mutations.',

    currentPage: {
        capabilities: ['Browse available jobs', 'Filter and search', 'View job detail'],
        safeguards: ['Only published jobs shown'],
        dependencies: ['job-actions.ts'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/client/post-job',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Job posting form. No financial mutations on submit.',

    currentPage: {
        capabilities: ['Create job posting', 'Set budget and requirements'],
        safeguards: ['Client-only access', 'Server-side validation'],
        dependencies: ['job-actions.ts'],
        accessControl: ['Client role required'],
    },
});

// ============================================================================
// GENERIC
// ============================================================================

register({
    route: '/login',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Authentication page. Email/password and OAuth login.',

    currentPage: {
        capabilities: ['Login with credentials', 'OAuth login'],
        safeguards: ['CSRF protection', 'Password hashing (bcrypt)'],
        dependencies: ['auth.ts'],
        accessControl: ['Public — unauthenticated'],
    },
});

register({
    route: '/register',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'User registration with role selection and email verification.',

    currentPage: {
        capabilities: ['Create account', 'Select role (client/freelancer)'],
        safeguards: ['Email uniqueness constraint', 'Email verification required'],
        dependencies: ['auth.ts'],
        accessControl: ['Public — unauthenticated'],
    },
});

register({
    route: '/dashboard',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Role-based dashboard redirect.',

    currentPage: {
        capabilities: ['View dashboard overview', 'Navigate to role-specific sections'],
        safeguards: ['Session required', 'Role-based routing'],
        accessControl: ['Authenticated users only'],
    },
});

// ============================================================================
// AUTH PAGES
// ============================================================================

register({
    route: '/2fa/verify',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Two-factor authentication verification page.',
    currentPage: {
        capabilities: ['Verify 2FA code'],
        safeguards: ['Code expiration', 'Rate limiting on attempts'],
        accessControl: ['Requires pending 2FA session'],
    },
});

register({
    route: '/forgot-password',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Password reset request form.',
    currentPage: {
        capabilities: ['Request password reset email'],
        safeguards: ['Email existence not disclosed', 'Rate limiting'],
        accessControl: ['Public — unauthenticated'],
    },
});

register({
    route: '/reset-password/[token]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Password reset form using token from email.',
    currentPage: {
        capabilities: ['Set new password using reset token'],
        safeguards: ['Token expiration', 'Token single-use'],
        accessControl: ['Public — requires valid token'],
    },
});

register({
    route: '/verify-email/[token]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Email verification page.',
    currentPage: {
        capabilities: ['Verify email address using token'],
        safeguards: ['Token expiration', 'Token single-use'],
        accessControl: ['Public — requires valid token'],
    },
});

register({
    route: '/verify-phone',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Phone number verification page.',
    currentPage: {
        capabilities: ['Verify phone number via SMS code'],
        safeguards: ['Code expiration', 'Rate limiting'],
        accessControl: ['Authenticated users only'],
    },
});

// ============================================================================
// ADMIN PAGES (NON-FINANCIAL)
// ============================================================================

register({
    route: '/admin/audit-logs',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'System audit log viewer for admin.',
    currentPage: {
        capabilities: ['View system audit logs'],
        safeguards: ['Admin-only access', 'Read-only'],
        accessControl: ['Admin role required'],
    },
});

register({
    route: '/admin/dashboard',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Admin dashboard overview with system metrics.',
    currentPage: {
        capabilities: ['View platform metrics', 'Navigate to admin sections'],
        safeguards: ['Admin-only access'],
        accessControl: ['Admin role required'],
    },
});

register({
    route: '/admin/disputes',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Admin dispute management panel.',
    currentPage: {
        capabilities: ['View all disputes', 'Resolve disputes'],
        safeguards: ['Admin-only access'],
        accessControl: ['Admin role required'],
    },
});

register({
    route: '/admin/jobs',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Admin job listing management.',
    currentPage: {
        capabilities: ['View all jobs', 'Moderate job listings'],
        safeguards: ['Admin-only access'],
        accessControl: ['Admin role required'],
    },
});

register({
    route: '/admin/trust',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Admin trust and verification management.',
    currentPage: {
        capabilities: ['Review user verification', 'Manage trust scores'],
        safeguards: ['Admin-only access'],
        accessControl: ['Admin role required'],
    },
});

register({
    route: '/admin/users',
    domain: PageDomain.ADMIN,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Admin user management panel.',
    currentPage: {
        capabilities: ['View all users', 'Manage user accounts'],
        safeguards: ['Admin-only access'],
        accessControl: ['Admin role required'],
    },
});

// ============================================================================
// CLIENT PAGES
// ============================================================================

register({
    route: '/client/contracts',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client contract listing page.',
    currentPage: {
        capabilities: ['View all contracts', 'Filter by status', 'Navigate to contract detail'],
        safeguards: ['Client-only access', 'Contracts scoped to user'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/dashboard',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client main dashboard with overview stats.',
    currentPage: {
        capabilities: ['View dashboard overview', 'Quick navigation to sections'],
        safeguards: ['Session required'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/dashboard-v3',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client dashboard v3 redesign.',
    currentPage: {
        capabilities: ['View dashboard overview', 'Quick navigation to sections'],
        safeguards: ['Session required'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/disputes',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client disputes listing and management.',
    currentPage: {
        capabilities: ['View disputes', 'Create new dispute', 'View dispute detail'],
        safeguards: ['Client-only access', 'Disputes scoped to user contracts'],
        accessControl: ['Client role required'],
    },

    attackDefense: [
        'Only contract participants can open dispute',
        'Escrow funds never directly mutable from dispute UI',
        'Admin arbitration required for resolution',
        'No direct ledger mutation from dispute creation',
    ],

    systemDiagrams: {
        ascii: `  User → openDispute()
        → Server validates contract ownership
        → Dispute created
        → Admin arbitration

  Resolution:
  Admin decision →
      → releaseMilestoneFunds OR refundEscrow
      → Escrow integrity asserted`,
    },
});

register({
    route: '/client/jobs',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client job listings management.',
    currentPage: {
        capabilities: ['View posted jobs', 'Navigate to job detail', 'Edit jobs'],
        safeguards: ['Client-only access', 'Jobs scoped to user'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/notifications',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client notifications center.',
    currentPage: {
        capabilities: ['View notifications', 'Mark as read'],
        safeguards: ['Notifications scoped to user'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/orders',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client orders listing.',
    currentPage: {
        capabilities: ['View orders', 'Track order status'],
        safeguards: ['Client-only access', 'Orders scoped to user'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/profile/edit',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client profile view and edit.',
    currentPage: {
        capabilities: ['View profile', 'Edit profile'],
        safeguards: ['Session required', 'Own profile only'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/proposals',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client received proposals listing.',
    currentPage: {
        capabilities: ['View proposals', 'Accept/reject proposals'],
        safeguards: ['Client-only access', 'Proposals scoped to user jobs'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/reviews/new',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client review submission.',
    currentPage: {
        capabilities: ['Submit review for completed contract'],
        safeguards: ['Review scoped to completed contracts'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/settings',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client settings pages (general, devices, notifications, security).',
    currentPage: {
        capabilities: ['View settings', 'Update preferences', 'Manage devices', 'Change password', 'Configure notifications'],
        safeguards: ['Session required', 'Own settings only'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/wallet/deposit',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client wallet deposit page.',
    currentPage: {
        capabilities: ['Deposit funds to wallet'],
        safeguards: ['Amount validated positive', 'Serializable tx', 'Idempotency key'],
        accessControl: ['Client role required'],
        dependencies: ['wallet-actions.ts'],
    },
    financialCore: {
        invariants: ['Deposit creates one DEPOSIT ledger entry per idempotency key'],
        concurrencyModel: 'Serializable isolation on deposit.',
    },
});

register({
    route: '/client/wallet/transactions/[id]',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client wallet transaction detail view.',
    currentPage: {
        capabilities: ['View transaction detail by ID'],
        safeguards: ['Transaction scoped to user wallet'],
        accessControl: ['Client role required', 'Own wallet only'],
        dependencies: ['wallet-actions.ts'],
    },
});

// ============================================================================
// FREELANCER PAGES
// ============================================================================

register({
    route: '/freelancer/contracts',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer contract listing page.',
    currentPage: {
        capabilities: ['View all contracts', 'Filter by status', 'Navigate to contract detail'],
        safeguards: ['Freelancer-only access', 'Contracts scoped to user'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/dashboard',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer main dashboard with earnings and activity overview.',
    currentPage: {
        capabilities: ['View dashboard overview', 'Quick navigation to sections'],
        safeguards: ['Session required'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/disputes',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer disputes listing and management.',
    currentPage: {
        capabilities: ['View disputes', 'Create new dispute', 'View dispute detail'],
        safeguards: ['Freelancer-only access', 'Disputes scoped to user contracts'],
        accessControl: ['Freelancer role required'],
    },

    attackDefense: [
        'Only contract participants can open dispute',
        'Escrow funds never directly mutable from dispute UI',
        'Admin arbitration required for resolution',
        'No direct ledger mutation from dispute creation',
    ],

    systemDiagrams: {
        ascii: `  User → openDispute()
        → Server validates contract ownership
        → Dispute created
        → Admin arbitration

  Resolution:
  Admin decision →
      → releaseMilestoneFunds OR refundEscrow
      → Escrow integrity asserted`,
    },
});

register({
    route: '/freelancer/jobs/[jobId]',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer job detail view.',
    currentPage: {
        capabilities: ['View job detail', 'Apply to job'],
        safeguards: ['Job must be published'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/notifications',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer notifications center.',
    currentPage: {
        capabilities: ['View notifications', 'Mark as read'],
        safeguards: ['Notifications scoped to user'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/overview',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer profile overview page.',
    currentPage: {
        capabilities: ['View profile overview'],
        safeguards: ['Session required'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/portfolio',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer portfolio management.',
    currentPage: {
        capabilities: ['View portfolio', 'Manage portfolio items'],
        safeguards: ['Own portfolio only'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/profile',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer profile view and edit.',
    currentPage: {
        capabilities: ['View profile', 'Edit profile'],
        safeguards: ['Session required', 'Own profile only'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/proposals',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer proposals listing and application forms.',
    currentPage: {
        capabilities: ['View submitted proposals', 'Apply to jobs', 'Track proposal status'],
        safeguards: ['Freelancer-only access', 'Proposals scoped to user'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/reviews/new',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer review submission.',
    currentPage: {
        capabilities: ['Submit review for completed contract'],
        safeguards: ['Review scoped to completed contracts'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/services',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer services management (create and list).',
    currentPage: {
        capabilities: ['View services', 'Create new service', 'Edit services'],
        safeguards: ['Own services only'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/settings',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer account settings.',
    currentPage: {
        capabilities: ['Update account settings', 'Change password'],
        safeguards: ['Session required', 'Own settings only'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/trust',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer trust and verification status.',
    currentPage: {
        capabilities: ['View trust level', 'Submit verification documents'],
        safeguards: ['Own trust profile only'],
        accessControl: ['Freelancer role required'],
    },
});

// ============================================================================
// SHARED CONTRACT ROUTES
// ============================================================================

register({
    route: '/contracts/[id]',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Shared contract detail view with roadmap.',
    currentPage: {
        capabilities: ['View contract detail', 'View roadmap'],
        safeguards: ['Contract participants only'],
        accessControl: ['Authenticated, contract participants required'],
    },

    attackDefense: [
        'Double release blocked via lock.released check inside Serializable tx',
        'Commission manipulation blocked by immutable commissionRate',
        'Refund-release race prevented by lock eligibility guard',
        'Milestone status re-fetched inside tx prevents stale state exploitation',
    ],

    systemDiagrams: {
        ascii: `  Milestone Lifecycle:
  DRAFT
    ↓ fundEscrow
  FUNDED
    ↓ submitDeliverable
  SUBMITTED
    ↓ approveTrialWork OR releaseMilestoneFunds
  RELEASED
    ↓ refundEscrow (if applicable)
  REFUNDED

  Escrow Integrity Formula:
  expectedUnreleased =
    |ESCROW_LOCK|
    - ESCROW_RELEASE
    - PLATFORM_FEE
    - REFUND`,
    },
});

// ============================================================================
// JOB ROUTES
// ============================================================================

register({
    route: '/jobs/[jobId]/control',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Job detail and control pages.',
    currentPage: {
        capabilities: ['View job detail', 'Manage job controls'],
        safeguards: ['Published jobs only for public view', 'Controls for job owner only'],
        accessControl: ['Varies by sub-route'],
    },
});

// ============================================================================
// PUBLIC PAGES
// ============================================================================

register({
    route: '/onboarding',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'User onboarding flow.',
    currentPage: {
        capabilities: ['Complete profile setup', 'Select preferences'],
        safeguards: ['Session required'],
        accessControl: ['Authenticated users only'],
    },
});

register({
    route: '/explore',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Explore page for discovering services and talent.',
    currentPage: {
        capabilities: ['Browse services', 'Browse talent'],
        accessControl: ['Public'],
    },
});

register({
    route: '/freelancer/[id]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Public freelancer profile page.',
    currentPage: {
        capabilities: ['View freelancer public profile'],
        accessControl: ['Public'],
    },
});

register({
    route: '/job/[id]',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Public job detail page.',
    currentPage: {
        capabilities: ['View job details'],
        accessControl: ['Public'],
    },
});

register({
    route: '/services',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Services listing and detail pages with checkout.',
    currentPage: {
        capabilities: ['Browse services', 'View service detail', 'Checkout'],
        safeguards: ['Checkout requires authentication'],
        accessControl: ['Public browsing, authenticated checkout'],
    },
});

register({
    route: '/talent',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Talent discovery page.',
    currentPage: {
        capabilities: ['Browse freelancer talent'],
        accessControl: ['Public'],
    },
});

register({
    route: '/access-denied',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Access denied error page.',
    currentPage: {
        capabilities: ['Display access denied message'],
        accessControl: ['Public'],
    },
});

register({
    route: '/features',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Platform features marketing page.',
    currentPage: {
        capabilities: ['View platform features'],
        accessControl: ['Public'],
    },
});

register({
    route: '/',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Landing page.',
    currentPage: {
        capabilities: ['View landing page', 'Navigate to login/register'],
        accessControl: ['Public'],
    },
});

register({
    route: '/pricing',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Pricing page.',
    currentPage: {
        capabilities: ['View pricing plans'],
        accessControl: ['Public'],
    },
});

register({
    route: '/video-call/[roomId]',
    domain: PageDomain.MESSAGING,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Video call room.',
    currentPage: {
        capabilities: ['Join video call', 'Audio/video controls'],
        safeguards: ['Room access requires valid participant session'],
        accessControl: ['Authenticated, room participant required'],
    },
    attackDefense: [
        'Room access: participant verification against session',
    ],
});

// ============================================================================
// REMAINING EXACT ROUTES — Sub-Routes & Dynamic Segments
// ============================================================================

register({
    route: '/client/disputes/new',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Create new client dispute.',
    inheritsFrom: '/client/disputes',
    currentPage: {
        capabilities: ['Submit dispute form'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/disputes/[id]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client dispute detail view.',
    inheritsFrom: '/client/disputes',
    currentPage: {
        capabilities: ['View dispute detail', 'Add evidence', 'Respond'],
        accessControl: ['Client role required', 'Dispute participant only'],
    },

    attackDefense: [
        'Only contract participants can view dispute detail',
        'No direct ledger mutation from dispute UI',
        'Admin arbitration required for resolution',
    ],

    systemDiagrams: {
        ascii: `  User → openDispute()
        → Server validates contract ownership
        → Dispute created → Admin arbitration

  Resolution:
  Admin → releaseMilestoneFunds OR refundEscrow
       → Escrow integrity asserted`,
    },
});

register({
    route: '/client/jobs/[jobId]/edit',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Edit an existing job posting.',
    inheritsFrom: '/client/jobs',
    currentPage: {
        capabilities: ['Edit job details', 'Update requirements'],
        safeguards: ['Job owner only'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/jobs/[jobId]',
    domain: PageDomain.JOBS,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client job detail view.',
    inheritsFrom: '/client/jobs',
    currentPage: {
        capabilities: ['View job detail', 'View proposals'],
        accessControl: ['Client role required', 'Job owner only'],
    },
});

register({
    route: '/client/proposals/[proposalId]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client proposal detail view.',
    inheritsFrom: '/client/proposals',
    currentPage: {
        capabilities: ['View proposal detail', 'Accept or reject'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/settings/devices',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client device management settings.',
    inheritsFrom: '/client/settings',
    currentPage: {
        capabilities: ['View logged-in devices', 'Revoke device sessions'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/settings/notifications',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client notification preferences.',
    inheritsFrom: '/client/settings',
    currentPage: {
        capabilities: ['Configure notification preferences'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/client/settings/security',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Client security settings.',
    inheritsFrom: '/client/settings',
    currentPage: {
        capabilities: ['Change password', 'Enable 2FA', 'View login history'],
        accessControl: ['Client role required'],
    },
});

register({
    route: '/contracts/[id]/roadmap',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Contract roadmap view.',
    inheritsFrom: '/contracts/[id]',
    currentPage: {
        capabilities: ['View milestone roadmap'],
        accessControl: ['Contract participants only'],
    },
});

register({
    route: '/freelancer/contracts/[contractId]',
    domain: PageDomain.CONTRACT,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer contract detail view with deliverables, milestones, and escrow status.',
    inheritsFrom: '/client/contracts/[contractId]',
    currentPage: {
        capabilities: ['View contract detail', 'Submit deliverables', 'View milestones'],
        accessControl: ['Freelancer role required'],
    },

    attackDefense: [
        'Double release blocked via lock.released check inside Serializable tx',
        'Commission manipulation blocked by immutable commissionRate',
        'Refund-release race prevented by lock eligibility guard',
        'Milestone status re-fetched inside tx prevents stale state exploitation',
    ],

    systemDiagrams: {
        ascii: `  Milestone Lifecycle:
  DRAFT → FUNDED → SUBMITTED → RELEASED → REFUNDED

  Escrow Integrity Formula:
  expectedUnreleased = |ESCROW_LOCK| - ESCROW_RELEASE - PLATFORM_FEE - REFUND`,
    },
});

register({
    route: '/freelancer/disputes/new',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Create new freelancer dispute.',
    inheritsFrom: '/freelancer/disputes',
    currentPage: {
        capabilities: ['Submit dispute form'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/disputes/[id]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer dispute detail view.',
    inheritsFrom: '/freelancer/disputes',
    currentPage: {
        capabilities: ['View dispute detail', 'Add evidence', 'Respond'],
        accessControl: ['Freelancer role required', 'Dispute participant only'],
    },

    attackDefense: [
        'Only contract participants can view dispute detail',
        'No direct ledger mutation from dispute UI',
        'Admin arbitration required for resolution',
    ],

    systemDiagrams: {
        ascii: `  User → openDispute()
        → Server validates contract ownership
        → Dispute created → Admin arbitration

  Resolution:
  Admin → releaseMilestoneFunds OR refundEscrow
       → Escrow integrity asserted`,
    },
});

register({
    route: '/freelancer/profile/edit',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer profile editing page.',
    inheritsFrom: '/freelancer/profile',
    currentPage: {
        capabilities: ['Edit profile details', 'Update skills and portfolio'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/proposals/apply',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer job application/proposal submission form.',
    inheritsFrom: '/freelancer/proposals',
    currentPage: {
        capabilities: ['Submit proposal', 'Set pricing and timeline'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/proposals/apply-backup',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Backup proposal submission form.',
    inheritsFrom: '/freelancer/proposals',
    currentPage: {
        capabilities: ['Submit proposal (backup form)'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/services/new',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Create new freelancer service listing.',
    inheritsFrom: '/freelancer/services',
    currentPage: {
        capabilities: ['Create service listing', 'Set pricing and description'],
        accessControl: ['Freelancer role required'],
    },
});

register({
    route: '/freelancer/wallet/transactions/[id]',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Freelancer wallet transaction detail view.',
    currentPage: {
        capabilities: ['View transaction detail by ID'],
        safeguards: ['Transaction scoped to user wallet'],
        accessControl: ['Freelancer role required', 'Own wallet only'],
        dependencies: ['wallet-actions.ts'],
    },
});

register({
    route: '/services/[id]/checkout',
    domain: PageDomain.FINANCIAL,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Service checkout page.',
    currentPage: {
        capabilities: ['Purchase service', 'Process payment'],
        safeguards: ['Authentication required', 'Price validation'],
        accessControl: ['Authenticated users only'],
    },
});

register({
    route: '/services/[id]',
    domain: PageDomain.GENERIC,
    version: '1.0.0',
    lastUpdated: '2026-02-23',
    description: 'Service detail page.',
    currentPage: {
        capabilities: ['View service details', 'Navigate to checkout'],
        accessControl: ['Public'],
    },
});

// ============================================================================
// Deep Freeze — Full Recursive Immutability
// ============================================================================

function deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;

    const propertyNames: (string | symbol)[] = [
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj),
    ];

    for (const name of propertyNames) {
        const value = (obj as Record<string | symbol, unknown>)[name];

        if (
            value !== null &&
            typeof value === 'object' &&
            !Object.isFrozen(value)
        ) {
            deepFreeze(value);
        }
    }

    return Object.freeze(obj);
}

deepFreeze(registry);

// ============================================================================
// Semantic Version Utilities
// ============================================================================

interface SemVer {
    major: number;
    minor: number;
    patch: number;
}

function parseSemVer(version: string): SemVer {
    const semverRegex = /^\d+\.\d+\.\d+$/;

    if (!semverRegex.test(version)) {
        throw new Error(
            `[System Intelligence] Invalid semantic version "${version}". ` +
            `Expected format: major.minor.patch (e.g., 1.0.0)`
        );
    }

    const [majorStr, minorStr, patchStr] = version.split('.');

    return {
        major: Number(majorStr),
        minor: Number(minorStr),
        patch: Number(patchStr),
    };
}

/**
 * Compare two semantic versions.
 * Returns -1 if a < b, 0 if equal, 1 if a > b.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
    const va = parseSemVer(a);
    const vb = parseSemVer(b);

    if (va.major !== vb.major) return va.major < vb.major ? -1 : 1;
    if (va.minor !== vb.minor) return va.minor < vb.minor ? -1 : 1;
    if (va.patch !== vb.patch) return va.patch < vb.patch ? -1 : 1;
    return 0;
}

// ============================================================================
// Drift Classification
// ============================================================================

export type VersionDrift =
    | 'MAJOR_ARCHITECTURAL_DRIFT'
    | 'MINOR_FEATURE_DRIFT'
    | 'PATCH_DOCUMENTATION_DRIFT'
    | 'AHEAD_OF_SYSTEM'
    | 'IN_SYNC';

/**
 * Classify the drift between a page's metadata version and the system version.
 */
export function classifyVersionDrift(
    pageVersion: string,
    systemVersion: string
): VersionDrift {
    const cmp = compareVersions(pageVersion, systemVersion);
    if (cmp === 0) return 'IN_SYNC';
    if (cmp > 0) return 'AHEAD_OF_SYSTEM';

    // pageVersion < systemVersion — determine severity
    const pv = parseSemVer(pageVersion);
    const sv = parseSemVer(systemVersion);

    if (pv.major < sv.major) return 'MAJOR_ARCHITECTURAL_DRIFT';
    if (pv.minor < sv.minor) return 'MINOR_FEATURE_DRIFT';
    return 'PATCH_DOCUMENTATION_DRIFT';
}

// ============================================================================
// Registry Validation
// ============================================================================

export interface RegistryMismatch {
    route: string;
    pageVersion: string;
    systemVersion: string;
    drift: VersionDrift;
}

export interface RegistryValidationResult {
    valid: boolean;
    mismatches: RegistryMismatch[];
    missingMetadata: string[];
}

/**
 * Validate all registry entries against SYSTEM_INTELLIGENCE_VERSION.
 */
export function validateIntelligenceRegistry(): RegistryValidationResult {
    const mismatches: RegistryMismatch[] = [];

    for (const route of Object.keys(registry)) {
        const meta = registry[route];
        const drift = classifyVersionDrift(meta.version, SYSTEM_INTELLIGENCE_VERSION);
        if (drift !== 'IN_SYNC') {
            mismatches.push({
                route,
                pageVersion: meta.version,
                systemVersion: SYSTEM_INTELLIGENCE_VERSION,
                drift,
            });
        }
    }

    return {
        valid: mismatches.length === 0,
        mismatches,
        missingMetadata: [], // populated by caller with known routes
    };
}

/**
 * Full registry audit: version drift for every registered route.
 */
export function getIntelligenceDriftReport(): {
    systemVersion: string;
    totalRoutes: number;
    inSync: number;
    drifted: RegistryMismatch[];
} {
    const drifted: RegistryMismatch[] = [];
    let inSync = 0;

    for (const route of Object.keys(registry)) {
        const meta = registry[route];
        const drift = classifyVersionDrift(meta.version, SYSTEM_INTELLIGENCE_VERSION);
        if (drift === 'IN_SYNC') {
            inSync++;
        } else {
            drifted.push({
                route,
                pageVersion: meta.version,
                systemVersion: SYSTEM_INTELLIGENCE_VERSION,
                drift,
            });
        }
    }

    return {
        systemVersion: SYSTEM_INTELLIGENCE_VERSION,
        totalRoutes: Object.keys(registry).length,
        inSync,
        drifted,
    };
}

/**
 * Assert a route has registered intelligence metadata.
 * Emits console.warn in development if missing.
 */
export function assertRouteRegistered(pathname: string): boolean {
    const meta = resolvePageIntelligence(pathname);
    if (!meta && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn(
            `[System Intelligence] ⚠ Route "${pathname}" has no registered metadata.\n` +
            `Register in src/system/intelligence-registry.ts\n` +
            `See /docs/system-intelligence-directive.md`
        );
    }
    return meta !== null;
}

// ============================================================================
// Governance Lockdown — Runtime Integrity Enforcement
// ============================================================================

/**
 * Runtime integrity assertion for production.
 * Throws a hard error if any version drift is detected.
 * Route coverage is validated at build time — this only checks drift.
 */
export function assertSystemIntelligenceIntegrity(): void {
    const report = getIntelligenceDriftReport();

    if (report.drifted.length > 0) {
        throw new Error(
            `[System Intelligence] Runtime integrity failure.\n` +
            `Detected ${report.drifted.length} version drift violation(s).\n` +
            `Fix registry before running in production.`
        );
    }
}
