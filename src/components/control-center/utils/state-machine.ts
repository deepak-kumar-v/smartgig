/**
 * Contract State Machine
 *
 * Static directed graph of all valid state transitions.
 * Used for the interactive SVG visualization.
 */

export const CONTRACT_STATE_MACHINE: Record<string, string[]> = {
    DRAFT: ['PENDING_REVIEW'],
    PENDING_REVIEW: ['DRAFT', 'ACCEPTED'],
    ACCEPTED: ['FINALIZED'],
    FINALIZED: ['FUNDED'],
    FUNDED: ['ACTIVE'],
    ACTIVE: ['COMPLETED', 'DISPUTED'],
    COMPLETED: ['CLOSED'],
    DISPUTED: ['ACTIVE', 'CLOSED'],
    CLOSED: [],
};

export const STATE_LABELS: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Pending Review',
    ACCEPTED: 'Accepted',
    FINALIZED: 'Finalized',
    FUNDED: 'Funded',
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    DISPUTED: 'Disputed',
    CLOSED: 'Closed',
};

export const STATE_DESCRIPTIONS: Record<string, string> = {
    DRAFT: 'Contract is being drafted by the client. Terms are editable.',
    PENDING_REVIEW: 'Contract sent for freelancer review. Terms are now immutable.',
    ACCEPTED: 'Freelancer accepted the contract terms. Ready for finalization.',
    FINALIZED: 'Contract terms locked. Awaiting escrow funding.',
    FUNDED: 'Escrow funded. Contract ready for activation.',
    ACTIVE: 'Work is in progress. Milestones being delivered.',
    COMPLETED: 'All deliverables approved. Funds released.',
    DISPUTED: 'Dispute raised. Under review by support.',
    CLOSED: 'Terminal state. Contract lifecycle ended.',
};

export const STATE_TRIGGERS: Record<string, { who: string; action: string; next: string }> = {
    DRAFT: { who: 'Client', action: 'sendForReview()', next: 'Sends contract for freelancer review' },
    PENDING_REVIEW: { who: 'Freelancer', action: 'acceptContract() / requestChanges()', next: 'Accept or request changes to contract' },
    ACCEPTED: { who: 'Client', action: 'finalizeContract()', next: 'Locks terms and prepares for funding' },
    FINALIZED: { who: 'Client', action: 'fundEscrow()', next: 'Funds escrow to activate contract' },
    FUNDED: { who: 'System', action: 'activateContract()', next: 'Activates contract for work' },
    ACTIVE: { who: 'Freelancer / Client', action: 'submitMilestone() / approveWork()', next: 'Deliver and approve milestones' },
    COMPLETED: { who: 'System', action: 'archiveContract()', next: 'Archives and closes contract' },
    DISPUTED: { who: 'Admin / System', action: 'resolveDispute()', next: 'Resolves dispute outcome' },
    CLOSED: { who: 'None', action: 'N/A', next: 'Terminal — no further transitions' },
};

// SVG layout positions for the graph (x, y coordinates as percentages)
export const STATE_POSITIONS: Record<string, { x: number; y: number }> = {
    DRAFT: { x: 10, y: 50 },
    PENDING_REVIEW: { x: 22, y: 20 },
    ACCEPTED: { x: 37, y: 50 },
    FINALIZED: { x: 50, y: 50 },
    FUNDED: { x: 63, y: 50 },
    ACTIVE: { x: 76, y: 50 },
    COMPLETED: { x: 88, y: 30 },
    DISPUTED: { x: 76, y: 85 },
    CLOSED: { x: 95, y: 65 },
};

export const ALL_STATES = Object.keys(CONTRACT_STATE_MACHINE);
