// ============================================================================
// Page-Level Intelligence Metadata Registry
//
// Each entry describes a page's capabilities, restrictions, and financial
// interactions for the System Intelligence Overlay.
// ============================================================================

export interface PageIntelligence {
    pageName: string;
    role: string;
    description: string;
    allowedActions: string[];
    blockedActions: string[];
    financialMutations: string[];
    safeguards: string[];
    ledgerInteractions: string[];
    isolationLevel: string | null;
    edgeCases: string[];
}

// Registry keyed by pathname prefix
const registry: Record<string, PageIntelligence> = {
    '/client/wallet': {
        pageName: 'Client Wallet',
        role: 'CLIENT',
        description: 'Shows ledger-derived balance (no stored balances). Displays available, locked, and pending withdrawal amounts.',
        allowedActions: ['Deposit funds', 'View transaction history', 'Request withdrawal'],
        blockedActions: ['Withdraw locked funds', 'Modify ledger entries', 'Override pending withdrawals'],
        financialMutations: ['depositToWallet (DEPOSIT ledger entry)'],
        safeguards: [
            'Deposit amount validated as positive Prisma.Decimal',
            'Idempotency key prevents duplicate deposits',
            'Serializable isolation on deposit transaction',
        ],
        ledgerInteractions: ['DEPOSIT: positive credit to wallet ledger'],
        isolationLevel: 'Serializable',
        edgeCases: [
            'Concurrent deposits serialized — no double-credit',
            'Available balance = SUM(ledger) - locked - pending withdrawals',
        ],
    },
    '/client/contracts': {
        pageName: 'Client Contracts',
        role: 'CLIENT',
        description: 'Manage contracts with freelancers. Fund escrow, release milestones, approve trial work.',
        allowedActions: ['Fund escrow', 'Release milestone funds', 'Approve trial work', 'Refund escrow', 'View financial timeline'],
        blockedActions: ['Release already-released milestones', 'Fund already-funded contracts', 'Modify commission rate'],
        financialMutations: ['fundEscrow', 'releaseMilestoneFunds', 'approveTrialWork', 'refundEscrow'],
        safeguards: [
            'Commission rate immutable after FINALIZED',
            'assertEscrowIntegrity called in every financial tx',
            'COMMISSION_SPLIT_INCONSISTENT assertion on every release',
            'Post-release wallet non-negative assertion',
        ],
        ledgerInteractions: ['ESCROW_LOCK (negative)', 'ESCROW_RELEASE (freelancer credit)', 'PLATFORM_FEE (platform credit)', 'REFUND (client credit)'],
        isolationLevel: 'Serializable',
        edgeCases: [
            'Double-release prevented: lock.released === true check inside tx',
            'Double-fund prevented: escrowAccount existence check inside tx',
            'Client sees gross release (ESCROW_RELEASE + PLATFORM_FEE)',
        ],
    },
    '/freelancer/wallet': {
        pageName: 'Freelancer Wallet',
        role: 'FREELANCER',
        description: 'View earnings. Freelancer sees NET payout (after commission). Request withdrawal of available funds.',
        allowedActions: ['View balance and history', 'Request withdrawal'],
        blockedActions: ['Deposit funds', 'Modify ledger', 'See commission details in wallet view', 'Withdraw locked funds'],
        financialMutations: ['requestWithdrawal'],
        safeguards: [
            'Available = total - locked - pending withdrawals',
            'Withdrawal amount must not exceed available',
            'Serializable isolation prevents concurrent over-withdrawal',
        ],
        ledgerInteractions: ['ESCROW_RELEASE (payout credit)', 'WITHDRAWAL (debit on approval)'],
        isolationLevel: 'Serializable',
        edgeCases: [
            'Pending withdrawals deducted from available before new request',
            'Freelancer sees net payout only (commission hidden in wallet)',
        ],
    },
    '/freelancer/wallet/withdraw': {
        pageName: 'Withdrawal Request',
        role: 'FREELANCER',
        description: 'Submit withdrawal request. Validated against available balance inside Serializable transaction.',
        allowedActions: ['Submit withdrawal request'],
        blockedActions: ['Withdraw more than available', 'Withdraw locked funds', 'Duplicate pending withdrawal'],
        financialMutations: ['requestWithdrawal'],
        safeguards: [
            'Balance re-derived inside transaction (no pre-tx assumption)',
            'Other pending withdrawals subtracted from available',
            'Serializable isolation level enforced',
        ],
        ledgerInteractions: ['Creates PENDING WithdrawalRequest (no ledger mutation until approval)'],
        isolationLevel: 'Serializable',
        edgeCases: [
            'Concurrent requests serialized at DB level',
            'Request creation is logged in FinancialMutationLog inside tx',
        ],
    },
    '/admin/financial-diagnostics': {
        pageName: 'Financial Diagnostics',
        role: 'ADMIN',
        description: 'Operational observability dashboard. View mutation logs, error logs, withdrawal snapshot, escrow health, and anomaly detection.',
        allowedActions: ['View recent mutations (50)', 'View recent errors (50)', 'View withdrawal snapshot', 'Run escrow health check (200 max)', 'Run anomaly scan'],
        blockedActions: ['Modify mutations', 'Delete error logs', 'Override escrow state', 'Change financial math'],
        financialMutations: ['None — read-only page'],
        safeguards: [
            'All queries bounded (take: 50-200)',
            'Escrow scan uses Serializable read-only tx per escrow',
            'No write operations from this page',
        ],
        ledgerInteractions: ['Read-only aggregation of all ledger entry types'],
        isolationLevel: null,
        edgeCases: [
            'Escrow scan limited to 200 per invocation',
            'Anomaly scan checks 5 deterministic rules',
        ],
    },
    '/admin/withdrawals': {
        pageName: 'Admin Withdrawals',
        role: 'ADMIN',
        description: 'Approve or reject pending withdrawal requests.',
        allowedActions: ['Approve withdrawal', 'Reject withdrawal', 'View pending requests'],
        blockedActions: ['Approve if balance insufficient', 'Double-approve same request', 'Reject non-PENDING request'],
        financialMutations: ['approveWithdrawal', 'rejectWithdrawal'],
        safeguards: [
            'approveWithdrawal: re-derives balance inside Serializable tx',
            'approveWithdrawal: subtracts OTHER pending withdrawals',
            'approveWithdrawal: post-debit assertion (available >= 0)',
            'rejectWithdrawal: in-tx status re-fetch, Serializable',
        ],
        ledgerInteractions: ['WITHDRAWAL: negative ledger entry on approval'],
        isolationLevel: 'Serializable',
        edgeCases: [
            'Concurrent approvals serialized at DB level',
            'Rejection is idempotent for already-REJECTED requests',
        ],
    },
    '/admin/financial-overview': {
        pageName: 'Financial Overview',
        role: 'ADMIN',
        description: 'Platform-wide financial metrics: revenue, escrow volume, transaction breakdown.',
        allowedActions: ['View platform revenue', 'View volume by transaction type', 'View revenue by contract'],
        blockedActions: ['Modify any financial data', 'Export raw ledger'],
        financialMutations: ['None — read-only page'],
        safeguards: [
            'Platform fee entries bounded (take: 1000)',
            'All aggregations use indexed fields',
        ],
        ledgerInteractions: ['Read-only aggregation of PLATFORM_FEE, ESCROW_LOCK, ESCROW_RELEASE entries'],
        isolationLevel: null,
        edgeCases: ['Revenue breakdown limited to most recent 1000 fee entries'],
    },
};

// Default fallback for unregistered pages
const defaultIntelligence: PageIntelligence = {
    pageName: 'Application Page',
    role: 'ALL',
    description: 'This page does not have specific financial intelligence metadata registered.',
    allowedActions: ['Navigation', 'View content'],
    blockedActions: [],
    financialMutations: [],
    safeguards: ['Standard authentication and role-based access control'],
    ledgerInteractions: [],
    isolationLevel: null,
    edgeCases: [],
};

export function getPageIntelligence(pathname: string): PageIntelligence {
    // Match longest prefix first
    const sorted = Object.keys(registry).sort((a, b) => b.length - a.length);
    for (const prefix of sorted) {
        if (pathname.startsWith(prefix)) {
            return registry[prefix];
        }
    }
    return defaultIntelligence;
}
