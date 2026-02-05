/**
 * SmartGIG Payments Service
 * 
 * Centralized mock service for all payment-related data:
 * - Wallet balances
 * - Ledger transactions
 * - Payment methods
 * - Invoices
 * - Withdrawals
 */

import { logAuditEvent } from '@/lib/audit-service';

// ============================================================================
// TYPES
// ============================================================================

export type LedgerTransactionType =
    | 'DEPOSIT'
    | 'ESCROW_LOCK'
    | 'ESCROW_RELEASE'
    | 'ESCROW_REFUND'
    | 'WITHDRAWAL'
    | 'WITHDRAWAL_FEE'
    | 'PLATFORM_FEE'
    | 'BONUS'
    | 'ADJUSTMENT';

export interface LedgerTransaction {
    id: string;
    type: LedgerTransactionType;
    amount: number;
    balanceAfter: number;
    description: string;
    contractId?: string;
    invoiceId?: string;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}

export type PaymentMethodType = 'card' | 'bank' | 'upi';

export interface PaymentMethod {
    id: string;
    type: PaymentMethodType;
    isDefault: boolean;
    createdAt: Date;
    // Card fields
    cardBrand?: string;
    cardLast4?: string;
    cardExpiryMonth?: number;
    cardExpiryYear?: number;
    cardholderName?: string;
    // Bank fields
    bankName?: string;
    accountLast4?: string;
    routingNumber?: string;
    accountType?: 'checking' | 'savings';
    // UPI fields
    upiId?: string;
    upiProvider?: string;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'REFUNDED' | 'CANCELLED';

export interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    issueDate: Date;
    dueDate: Date;
    paidDate?: Date;
    // Parties
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientAddress?: string;
    freelancerId: string;
    freelancerName: string;
    freelancerEmail: string;
    freelancerAddress?: string;
    // Amounts
    lineItems: InvoiceLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    platformFee: number;
    total: number;
    // References
    contractId?: string;
    milestoneId?: string;
    notes?: string;
}

export type WithdrawalStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Withdrawal {
    id: string;
    amount: number;
    fee: number;
    netAmount: number;
    status: WithdrawalStatus;
    paymentMethodId: string;
    paymentMethodType: PaymentMethodType;
    paymentMethodLast4: string;
    requestedAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    failureReason?: string;
    referenceNumber?: string;
}

export interface Wallet {
    userId: string;
    availableBalance: number;
    pendingBalance: number;
    lockedBalance: number;
    totalEarnings: number;
    totalWithdrawn: number;
}

// ============================================================================
// MOCK DATA STORE
// ============================================================================

const wallets: Map<string, Wallet> = new Map();
const ledgerTransactions: LedgerTransaction[] = [];
const paymentMethods: PaymentMethod[] = [];
const invoices: Invoice[] = [];
const withdrawals: Withdrawal[] = [];

// Initialize with demo data
function initializeMockData() {
    // Demo wallet
    wallets.set('user-1', {
        userId: 'user-1',
        availableBalance: 12450.00,
        pendingBalance: 3200.00,
        lockedBalance: 8500.00,
        totalEarnings: 156200.00,
        totalWithdrawn: 132550.00,
    });

    // Demo ledger transactions
    let runningBalance = 12450.00;
    const demoTransactions: Omit<LedgerTransaction, 'balanceAfter'>[] = [
        { id: 'txn-1', type: 'ESCROW_RELEASE', amount: 2500.00, description: 'Milestone 3 payment released', contractId: 'contract-789', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { id: 'txn-2', type: 'PLATFORM_FEE', amount: -250.00, description: 'Platform fee (10%)', contractId: 'contract-789', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
        { id: 'txn-3', type: 'WITHDRAWAL', amount: -5000.00, description: 'Withdrawal to Bank ****6789', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        { id: 'txn-4', type: 'WITHDRAWAL_FEE', amount: -2.50, description: 'Withdrawal processing fee', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        { id: 'txn-5', type: 'ESCROW_RELEASE', amount: 1800.00, description: 'Milestone 2 payment released', contractId: 'contract-456', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
        { id: 'txn-6', type: 'PLATFORM_FEE', amount: -180.00, description: 'Platform fee (10%)', contractId: 'contract-456', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
        { id: 'txn-7', type: 'BONUS', amount: 100.00, description: 'Referral bonus credited', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
        { id: 'txn-8', type: 'ESCROW_REFUND', amount: 500.00, description: 'Partial refund from dispute resolution', contractId: 'contract-123', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96) },
    ];

    // Calculate balances in reverse order
    for (let i = demoTransactions.length - 1; i >= 0; i--) {
        const txn = demoTransactions[i];
        ledgerTransactions.unshift({
            ...txn,
            balanceAfter: runningBalance,
        });
        runningBalance -= txn.amount;
    }

    // Demo payment methods
    paymentMethods.push(
        {
            id: 'pm-1',
            type: 'card',
            isDefault: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
            cardBrand: 'Visa',
            cardLast4: '4242',
            cardExpiryMonth: 12,
            cardExpiryYear: 2027,
            cardholderName: 'John Doe',
        },
        {
            id: 'pm-2',
            type: 'bank',
            isDefault: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
            bankName: 'Chase Bank',
            accountLast4: '6789',
            routingNumber: '021000021',
            accountType: 'checking',
        },
        {
            id: 'pm-3',
            type: 'upi',
            isDefault: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
            upiId: 'john****@okaxis',
            upiProvider: 'Google Pay',
        }
    );

    // Demo invoices
    invoices.push(
        {
            id: 'inv-001',
            invoiceNumber: 'INV-2026-0042',
            status: 'PAID',
            issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            clientId: 'client-1',
            clientName: 'TechCorp Solutions',
            clientEmail: 'billing@techcorp.com',
            clientAddress: '123 Business Ave, New York, NY 10001',
            freelancerId: 'user-1',
            freelancerName: 'John Doe',
            freelancerEmail: 'john@smartgig.com',
            freelancerAddress: '456 Freelancer St, San Francisco, CA 94102',
            lineItems: [
                { id: 'li-1', description: 'React Development - Phase 1', quantity: 40, unitPrice: 85, total: 3400 },
                { id: 'li-2', description: 'UI/UX Consultation', quantity: 5, unitPrice: 120, total: 600 },
            ],
            subtotal: 4000,
            taxRate: 0,
            taxAmount: 0,
            platformFee: 400,
            total: 4000,
            contractId: 'contract-789',
            milestoneId: 'milestone-3',
        },
        {
            id: 'inv-002',
            invoiceNumber: 'INV-2026-0041',
            status: 'PENDING',
            issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12),
            clientId: 'client-2',
            clientName: 'StartupXYZ',
            clientEmail: 'finance@startupxyz.io',
            freelancerId: 'user-1',
            freelancerName: 'John Doe',
            freelancerEmail: 'john@smartgig.com',
            lineItems: [
                { id: 'li-3', description: 'Mobile App Development - Sprint 1', quantity: 60, unitPrice: 90, total: 5400 },
            ],
            subtotal: 5400,
            taxRate: 0.08,
            taxAmount: 432,
            platformFee: 540,
            total: 5832,
            contractId: 'contract-456',
        },
        {
            id: 'inv-003',
            invoiceNumber: 'INV-2026-0038',
            status: 'REFUNDED',
            issueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16),
            paidDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
            clientId: 'client-3',
            clientName: 'MegaCorp Inc',
            clientEmail: 'ap@megacorp.com',
            freelancerId: 'user-1',
            freelancerName: 'John Doe',
            freelancerEmail: 'john@smartgig.com',
            lineItems: [
                { id: 'li-4', description: 'Backend API Development', quantity: 20, unitPrice: 100, total: 2000 },
            ],
            subtotal: 2000,
            taxRate: 0,
            taxAmount: 0,
            platformFee: 200,
            total: 2000,
            contractId: 'contract-123',
            notes: 'Refunded due to dispute resolution',
        }
    );

    // Demo withdrawals
    withdrawals.push(
        {
            id: 'wd-1',
            amount: 5000,
            fee: 2.50,
            netAmount: 4997.50,
            status: 'COMPLETED',
            paymentMethodId: 'pm-2',
            paymentMethodType: 'bank',
            paymentMethodLast4: '6789',
            requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
            processedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
            referenceNumber: 'REF-2026-001234',
        },
        {
            id: 'wd-2',
            amount: 3000,
            fee: 2.50,
            netAmount: 2997.50,
            status: 'PROCESSING',
            paymentMethodId: 'pm-2',
            paymentMethodType: 'bank',
            paymentMethodLast4: '6789',
            requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            processedAt: new Date(Date.now() - 1000 * 60 * 30),
        }
    );
}

initializeMockData();

// ============================================================================
// WALLET FUNCTIONS
// ============================================================================

export async function getWallet(userId: string): Promise<Wallet> {
    return wallets.get(userId) || {
        userId,
        availableBalance: 0,
        pendingBalance: 0,
        lockedBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
    };
}

// ============================================================================
// LEDGER FUNCTIONS
// ============================================================================

export async function getLedgerTransactions(filters?: {
    userId?: string;
    type?: LedgerTransactionType;
    contractId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
}): Promise<{ transactions: LedgerTransaction[]; total: number }> {
    let filtered = [...ledgerTransactions];

    if (filters?.type) {
        filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters?.contractId) {
        filtered = filtered.filter(t => t.contractId === filters.contractId);
    }
    if (filters?.fromDate) {
        filtered = filtered.filter(t => t.createdAt >= filters.fromDate!);
    }
    if (filters?.toDate) {
        filtered = filtered.filter(t => t.createdAt <= filters.toDate!);
    }

    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    return {
        transactions: filtered.slice(offset, offset + limit),
        total,
    };
}

// ============================================================================
// PAYMENT METHODS FUNCTIONS
// ============================================================================

export async function getPaymentMethods(userId?: string): Promise<PaymentMethod[]> {
    return [...paymentMethods];
}

export async function getPaymentMethod(id: string): Promise<PaymentMethod | null> {
    return paymentMethods.find(pm => pm.id === id) || null;
}

export async function addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod> {
    const newMethod: PaymentMethod = {
        ...data,
        id: `pm-${Date.now()}`,
        createdAt: new Date(),
    };

    // If this is the first method or marked as default, update defaults
    if (data.isDefault || paymentMethods.length === 0) {
        paymentMethods.forEach(pm => pm.isDefault = false);
        newMethod.isDefault = true;
    }

    paymentMethods.push(newMethod);

    await logAuditEvent({
        actorId: 'user-1',
        actorRole: 'FREELANCER',
        actionType: 'PAYMENT_METHOD_ADDED',
        entityType: 'PAYMENT',
        entityId: newMethod.id,
        metadata: { type: newMethod.type },
    });

    return newMethod;
}

export async function removePaymentMethod(id: string): Promise<boolean> {
    const index = paymentMethods.findIndex(pm => pm.id === id);
    if (index === -1) return false;

    const removed = paymentMethods.splice(index, 1)[0];

    // If removed was default, set first remaining as default
    if (removed.isDefault && paymentMethods.length > 0) {
        paymentMethods[0].isDefault = true;
    }

    await logAuditEvent({
        actorId: 'user-1',
        actorRole: 'FREELANCER',
        actionType: 'PAYMENT_METHOD_REMOVED',
        entityType: 'PAYMENT',
        entityId: id,
        metadata: { type: removed.type },
    });

    return true;
}

export async function setDefaultPaymentMethod(id: string): Promise<boolean> {
    const method = paymentMethods.find(pm => pm.id === id);
    if (!method) return false;

    paymentMethods.forEach(pm => pm.isDefault = pm.id === id);
    return true;
}

// ============================================================================
// INVOICE FUNCTIONS
// ============================================================================

export async function getInvoices(filters?: {
    userId?: string;
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
}): Promise<{ invoices: Invoice[]; total: number }> {
    let filtered = [...invoices];

    if (filters?.status) {
        filtered = filtered.filter(inv => inv.status === filters.status);
    }

    const total = filtered.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    return {
        invoices: filtered.slice(offset, offset + limit),
        total,
    };
}

export async function getInvoice(id: string): Promise<Invoice | null> {
    return invoices.find(inv => inv.id === id) || null;
}

export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    return invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
}

// ============================================================================
// WITHDRAWAL FUNCTIONS
// ============================================================================

export async function getWithdrawals(userId?: string): Promise<Withdrawal[]> {
    return [...withdrawals];
}

export async function getWithdrawal(id: string): Promise<Withdrawal | null> {
    return withdrawals.find(w => w.id === id) || null;
}

export async function requestWithdrawal(data: {
    amount: number;
    paymentMethodId: string;
    userId: string;
    userRole: 'FREELANCER' | 'CLIENT' | 'ADMIN';
}): Promise<{ success: boolean; withdrawal?: Withdrawal; error?: string }> {
    const { amount, paymentMethodId, userId, userRole } = data;

    // Get payment method
    const method = await getPaymentMethod(paymentMethodId);
    if (!method) {
        return { success: false, error: 'Payment method not found' };
    }

    // Get wallet
    const wallet = await getWallet(userId);
    if (wallet.availableBalance < amount) {
        return { success: false, error: 'Insufficient balance' };
    }

    // Calculate fee
    const fee = 2.50; // Flat fee for demo
    const netAmount = amount - fee;

    // Create withdrawal
    const withdrawal: Withdrawal = {
        id: `wd-${Date.now()}`,
        amount,
        fee,
        netAmount,
        status: 'REQUESTED',
        paymentMethodId,
        paymentMethodType: method.type,
        paymentMethodLast4: method.cardLast4 || method.accountLast4 || method.upiId?.slice(-4) || '****',
        requestedAt: new Date(),
    };

    withdrawals.unshift(withdrawal);

    // Update wallet balance
    wallet.availableBalance -= amount;

    await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        actionType: 'WITHDRAWAL_REQUESTED',
        entityType: 'PAYMENT',
        entityId: withdrawal.id,
        metadata: { amount, paymentMethodId, fee, netAmount },
    });

    return { success: true, withdrawal };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function maskCardNumber(last4: string): string {
    return `•••• •••• •••• ${last4}`;
}

export function maskBankAccount(last4: string): string {
    return `•••••${last4}`;
}

export function getPaymentMethodDisplay(method: PaymentMethod): string {
    switch (method.type) {
        case 'card':
            return `${method.cardBrand} •••• ${method.cardLast4}`;
        case 'bank':
            return `${method.bankName} •••• ${method.accountLast4}`;
        case 'upi':
            return method.upiId || 'UPI';
        default:
            return 'Unknown';
    }
}
