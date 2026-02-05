
import {
    Invoice as PrismaInvoice,
    InvoiceLineItem as PrismaLineItem,
    ClientProfile,
    FreelancerProfile,
    WalletLedger
} from "@prisma/client";

import {
    Invoice as MockInvoice,
    LedgerTransaction,
    getInvoices as getInvoicesMock,
    getInvoice as getInvoiceMock,
    getLedgerTransactions as getLedgerMock
} from "@/lib/payments-service";

// Type matches the structure returned by our API routes (Prisma includes)
type ApiInvoice = PrismaInvoice & {
    lineItems: PrismaLineItem[];
    client: ClientProfile & { user: { name: string | null; email: string } };
    freelancer: FreelancerProfile & { user: { name: string | null; email: string } };
}

function mapInvoiceToMock(apiInv: ApiInvoice): MockInvoice {
    return {
        id: apiInv.id,
        invoiceNumber: apiInv.invoiceNumber,
        status: apiInv.status as any,
        issueDate: new Date(apiInv.issueDate),
        dueDate: new Date(apiInv.dueDate),
        paidDate: apiInv.paidDate ? new Date(apiInv.paidDate) : undefined,
        clientId: apiInv.clientId,
        clientName: apiInv.client.user.name || apiInv.client.companyName || 'Client',
        clientEmail: apiInv.client.user.email,
        clientAddress: undefined,
        freelancerId: apiInv.freelancerId,
        freelancerName: apiInv.freelancer.user.name || apiInv.freelancer.title || 'Freelancer',
        freelancerEmail: apiInv.freelancer.user.email,
        freelancerAddress: undefined,
        lineItems: apiInv.lineItems.map(li => ({
            id: li.id,
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            total: li.total
        })),
        subtotal: apiInv.subtotal,
        taxRate: apiInv.taxRate,
        taxAmount: apiInv.taxAmount,
        platformFee: apiInv.platformFee,
        total: apiInv.total,
        contractId: undefined // Add to API if needed
    };
}

function mapLedgerToMock(ledger: WalletLedger): LedgerTransaction {
    return {
        id: ledger.id,
        type: ledger.type as any, // Cast string to LedgerTransactionType
        amount: ledger.amount,
        balanceAfter: ledger.balanceAfter,
        description: ledger.reason, // Map reason to description
        contractId: ledger.contractId || undefined,
        createdAt: new Date(ledger.createdAt),
        metadata: undefined
    };
}

export const paymentsApi = {
    getLedger: async (filters?: {
        type?: string;
        contractId?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ transactions: LedgerTransaction[]; total: number }> => {
        try {
            // Build query string
            const params = new URLSearchParams();
            if (filters?.type) params.append('type', filters.type);
            if (filters?.contractId) params.append('contractId', filters.contractId);
            if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
            if (filters?.dateTo) params.append('dateTo', filters.dateTo);
            if (filters?.limit) params.append('limit', filters.limit.toString());
            if (filters?.offset) params.append('offset', filters.offset.toString());

            const res = await fetch(`/api/payments/ledger?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch ledger');
            const data: WalletLedger[] = await res.json();
            return {
                transactions: data.map(mapLedgerToMock),
                total: data.length
            };
        } catch (error) {
            console.warn("Using mock ledger fallback", error);
            // Map filters to mock service format
            const mockFilters: any = {};
            if (filters?.type) mockFilters.type = filters.type;
            if (filters?.contractId) mockFilters.contractId = filters.contractId;
            if (filters?.dateFrom) mockFilters.fromDate = new Date(filters.dateFrom);
            if (filters?.dateTo) mockFilters.toDate = new Date(filters.dateTo);
            if (filters?.limit) mockFilters.limit = filters.limit;
            if (filters?.offset) mockFilters.offset = filters.offset;
            return getLedgerMock(mockFilters);
        }
    },

    getInvoices: async (filters?: any): Promise<{ invoices: MockInvoice[]; total: number }> => {
        try {
            const res = await fetch('/api/invoices');
            if (!res.ok) throw new Error('Failed to fetch invoices');
            const data: ApiInvoice[] = await res.json();
            return {
                invoices: data.map(mapInvoiceToMock),
                total: data.length
            };
        } catch (error) {
            console.warn("Using mock invoices fallback", error);
            return getInvoicesMock(filters);
        }
    },

    getInvoice: async (id: string): Promise<MockInvoice | null> => {
        try {
            const res = await fetch(`/api/invoices/${id}`);
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error('Failed to fetch invoice');
            }
            const data: ApiInvoice = await res.json();
            return mapInvoiceToMock(data);
        } catch (error) {
            console.warn(`Using mock invoice fallback for ${id}`, error);
            return getInvoiceMock(id);
        }
    }
};
