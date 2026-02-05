// =============================================================================
// SmartGIG Platform - Service Layer (Fake API Functions)
// =============================================================================

import {
    mockUsers, mockFreelancerProfiles, mockClientProfiles,
    mockJobs, mockProposals, mockContracts, mockEscrowAccounts,
    mockReviews, mockDisputes, mockConversations, mockMessages,
    mockPlatformStats, jobCategories, skillsList
} from './mock-data';

import type {
    User, FreelancerProfile, ClientProfile, Job, Proposal, Contract,
    EscrowAccount, Review, Dispute, Conversation, Message, PlatformStats,
    JobPostFormData, ProposalFormData, FreelancerProfileFormData
} from './types';

// -----------------------------------------------------------------------------
// Helper: Simulate network delay
// -----------------------------------------------------------------------------

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const simulateLatency = () => delay(Math.random() * 300 + 100);

// -----------------------------------------------------------------------------
// User Services
// -----------------------------------------------------------------------------

export async function getCurrentUser(): Promise<User | null> {
    await simulateLatency();
    // Return first freelancer for demo purposes
    return mockUsers[0];
}

export async function getUserById(id: string): Promise<User | null> {
    await simulateLatency();
    return mockUsers.find(u => u.id === id) || null;
}

export async function getUsers(filters?: {
    role?: 'FREELANCER' | 'CLIENT' | 'ADMIN';
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ users: User[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockUsers];

    if (filters?.role) {
        filtered = filtered.filter(u => u.role === filters.role);
    }
    if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(u =>
            u.name.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        users: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

// -----------------------------------------------------------------------------
// Freelancer Profile Services
// -----------------------------------------------------------------------------

export async function getFreelancerProfile(userId: string): Promise<FreelancerProfile | null> {
    await simulateLatency();
    return mockFreelancerProfiles.find(fp => fp.userId === userId) || null;
}

export async function getFreelancerProfileById(id: string): Promise<FreelancerProfile | null> {
    await simulateLatency();
    return mockFreelancerProfiles.find(fp => fp.id === id) || null;
}

export async function updateFreelancerProfile(
    id: string,
    data: Partial<FreelancerProfileFormData>
): Promise<FreelancerProfile> {
    await simulateLatency();
    const profile = mockFreelancerProfiles.find(fp => fp.id === id);
    if (!profile) throw new Error('Profile not found');
    // In real app, would update the profile
    return { ...profile, ...data, updatedAt: new Date() } as FreelancerProfile;
}

export async function searchFreelancers(filters?: {
    skills?: string[];
    category?: string;
    minRate?: number;
    maxRate?: number;
    experienceLevel?: string;
    availability?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ freelancers: FreelancerProfile[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockFreelancerProfiles];

    if (filters?.skills?.length) {
        filtered = filtered.filter(fp =>
            filters.skills!.some(skill =>
                fp.skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
            )
        );
    }
    if (filters?.category) {
        filtered = filtered.filter(fp => fp.categories.includes(filters.category!));
    }
    if (filters?.minRate) {
        filtered = filtered.filter(fp => fp.hourlyRate >= filters.minRate!);
    }
    if (filters?.maxRate) {
        filtered = filtered.filter(fp => fp.hourlyRate <= filters.maxRate!);
    }
    if (filters?.availability) {
        filtered = filtered.filter(fp => fp.availability === filters.availability);
    }
    if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(fp =>
            fp.headline.toLowerCase().includes(search) ||
            fp.bio.toLowerCase().includes(search)
        );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        freelancers: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

// -----------------------------------------------------------------------------
// Client Profile Services
// -----------------------------------------------------------------------------

export async function getClientProfile(userId: string): Promise<ClientProfile | null> {
    await simulateLatency();
    return mockClientProfiles.find(cp => cp.userId === userId) || null;
}

export async function getClientProfileById(id: string): Promise<ClientProfile | null> {
    await simulateLatency();
    return mockClientProfiles.find(cp => cp.id === id) || null;
}

// -----------------------------------------------------------------------------
// Job Services
// -----------------------------------------------------------------------------

export async function getJobs(filters?: {
    status?: string;
    category?: string;
    skills?: string[];
    budgetType?: 'FIXED' | 'HOURLY';
    minBudget?: number;
    maxBudget?: number;
    experienceLevel?: string;
    search?: string;
    clientId?: string;
    page?: number;
    limit?: number;
}): Promise<{ jobs: Job[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockJobs];

    if (filters?.status) {
        filtered = filtered.filter(j => j.status === filters.status);
    }
    if (filters?.category) {
        filtered = filtered.filter(j => j.category === filters.category);
    }
    if (filters?.skills?.length) {
        filtered = filtered.filter(j =>
            filters.skills!.some(skill => j.skills.includes(skill))
        );
    }
    if (filters?.budgetType) {
        filtered = filtered.filter(j => j.budgetType === filters.budgetType);
    }
    if (filters?.minBudget) {
        filtered = filtered.filter(j => j.budgetMax >= filters.minBudget!);
    }
    if (filters?.maxBudget) {
        filtered = filtered.filter(j => j.budgetMin <= filters.maxBudget!);
    }
    if (filters?.experienceLevel) {
        filtered = filtered.filter(j => j.experienceLevel === filters.experienceLevel);
    }
    if (filters?.clientId) {
        filtered = filtered.filter(j => j.clientId === filters.clientId);
    }
    if (filters?.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(j =>
            j.title.toLowerCase().includes(search) ||
            j.description.toLowerCase().includes(search)
        );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        jobs: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

export async function getJobById(id: string): Promise<Job | null> {
    await simulateLatency();
    return mockJobs.find(j => j.id === id) || null;
}

export async function createJob(data: JobPostFormData): Promise<Job> {
    await simulateLatency();
    const newJob: Job = {
        id: `job-${Date.now()}`,
        clientId: 'cp-1', // Would come from session
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        skills: data.skills,
        experienceLevel: data.experienceLevel,
        budgetType: data.budgetType,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        projectType: data.projectType,
        duration: data.duration,
        weeklyHours: data.weeklyHours,
        startDate: data.startDate,
        deadline: data.deadline,
        isRemote: data.isRemote,
        locationRestrictions: data.locationRestrictions,
        visibility: data.visibility,
        allowTrialTask: data.allowTrialTask,
        contractToHire: data.contractToHire,
        screeningQuestions: data.screeningQuestions.map((q, i) => ({ ...q, id: `sq-${i}` })),
        attachments: [],
        status: 'OPEN',
        proposalCount: 0,
        viewCount: 0,
        invitesSent: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: new Date(),
    };
    return newJob;
}

export async function updateJob(id: string, data: Partial<Job>): Promise<Job> {
    await simulateLatency();
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return { ...job, ...data, updatedAt: new Date() };
}

// -----------------------------------------------------------------------------
// Proposal Services
// -----------------------------------------------------------------------------

export async function getProposals(filters?: {
    jobId?: string;
    freelancerId?: string;
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{ proposals: Proposal[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockProposals];

    if (filters?.jobId) {
        filtered = filtered.filter(p => p.jobId === filters.jobId);
    }
    if (filters?.freelancerId) {
        filtered = filtered.filter(p => p.freelancerId === filters.freelancerId);
    }
    if (filters?.status) {
        filtered = filtered.filter(p => p.status === filters.status);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        proposals: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

export async function getProposalById(id: string): Promise<Proposal | null> {
    await simulateLatency();
    return mockProposals.find(p => p.id === id) || null;
}

export async function createProposal(jobId: string, data: ProposalFormData): Promise<Proposal> {
    await simulateLatency();
    const newProposal: Proposal = {
        id: `prop-${Date.now()}`,
        jobId,
        freelancerId: 'fp-1', // Would come from session
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        estimatedDuration: data.estimatedDuration,
        proposedMilestones: data.proposedMilestones,
        relevantPortfolio: data.relevantPortfolio,
        additionalAttachments: [],
        acceptsTrialTask: data.acceptsTrialTask,
        trialTaskProposal: data.trialTaskProposal,
        screeningAnswers: Object.entries(data.screeningAnswers).map(([qId, answer]) => ({
            questionId: qId,
            answer,
        })),
        status: 'PENDING',
        isShortlisted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
    };
    return newProposal;
}

export async function updateProposalStatus(
    id: string,
    status: 'SHORTLISTED' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED'
): Promise<Proposal> {
    await simulateLatency();
    const proposal = mockProposals.find(p => p.id === id);
    if (!proposal) throw new Error('Proposal not found');
    return { ...proposal, status, updatedAt: new Date() };
}

// -----------------------------------------------------------------------------
// Contract Services
// -----------------------------------------------------------------------------

export async function getContracts(filters?: {
    clientId?: string;
    freelancerId?: string;
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{ contracts: Contract[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockContracts];

    if (filters?.clientId) {
        filtered = filtered.filter(c => c.clientId === filters.clientId);
    }
    if (filters?.freelancerId) {
        filtered = filtered.filter(c => c.freelancerId === filters.freelancerId);
    }
    if (filters?.status) {
        filtered = filtered.filter(c => c.status === filters.status);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        contracts: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

export async function getContractById(id: string): Promise<Contract | null> {
    await simulateLatency();
    return mockContracts.find(c => c.id === id) || null;
}

export async function updateMilestoneStatus(
    contractId: string,
    milestoneId: string,
    status: 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED'
): Promise<Contract> {
    await simulateLatency();
    const contract = mockContracts.find(c => c.id === contractId);
    if (!contract) throw new Error('Contract not found');
    // Would update milestone status
    return contract;
}

// -----------------------------------------------------------------------------
// Escrow Services
// -----------------------------------------------------------------------------

export async function getEscrowAccount(contractId: string): Promise<EscrowAccount | null> {
    await simulateLatency();
    return mockEscrowAccounts.find(e => e.contractId === contractId) || null;
}

export async function depositToEscrow(
    contractId: string,
    amount: number,
    paymentMethodId: string
): Promise<EscrowAccount> {
    await simulateLatency();
    const escrow = mockEscrowAccounts.find(e => e.contractId === contractId);
    if (!escrow) throw new Error('Escrow account not found');
    // Would process deposit
    return escrow;
}

export async function requestRelease(
    escrowId: string,
    milestoneId: string
): Promise<EscrowAccount> {
    await simulateLatency();
    const escrow = mockEscrowAccounts.find(e => e.id === escrowId);
    if (!escrow) throw new Error('Escrow account not found');
    // Would create release request
    return escrow;
}

export async function approveRelease(
    escrowId: string,
    milestoneId: string
): Promise<EscrowAccount> {
    await simulateLatency();
    const escrow = mockEscrowAccounts.find(e => e.id === escrowId);
    if (!escrow) throw new Error('Escrow account not found');
    // Would approve and process release
    return escrow;
}

// -----------------------------------------------------------------------------
// Review Services
// -----------------------------------------------------------------------------

export async function getReviews(filters?: {
    revieweeId?: string;
    contractId?: string;
    page?: number;
    limit?: number;
}): Promise<{ reviews: Review[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockReviews];

    if (filters?.revieweeId) {
        filtered = filtered.filter(r => r.revieweeId === filters.revieweeId);
    }
    if (filters?.contractId) {
        filtered = filtered.filter(r => r.contractId === filters.contractId);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        reviews: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

export async function createReview(data: Partial<Review>): Promise<Review> {
    await simulateLatency();
    const newReview: Review = {
        id: `review-${Date.now()}`,
        contractId: data.contractId!,
        reviewerId: data.reviewerId!,
        reviewerRole: data.reviewerRole!,
        revieweeId: data.revieweeId!,
        overallRating: data.overallRating!,
        qualityRating: data.qualityRating,
        communicationRating: data.communicationRating,
        timelinessRating: data.timelinessRating,
        cooperationRating: data.cooperationRating,
        title: data.title,
        content: data.content!,
        isPublic: true,
        createdAt: new Date(),
    };
    return newReview;
}

// -----------------------------------------------------------------------------
// Dispute Services
// -----------------------------------------------------------------------------

export async function getDisputes(filters?: {
    status?: string;
    contractId?: string;
    userId?: string;
    page?: number;
    limit?: number;
}): Promise<{ disputes: Dispute[]; total: number }> {
    await simulateLatency();
    let filtered = [...mockDisputes];

    if (filters?.status) {
        filtered = filtered.filter(d => d.status === filters.status);
    }
    if (filters?.contractId) {
        filtered = filtered.filter(d => d.contractId === filters.contractId);
    }
    if (filters?.userId) {
        filtered = filtered.filter(d =>
            d.initiatorId === filters.userId || d.respondentId === filters.userId
        );
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const start = (page - 1) * limit;

    return {
        disputes: filtered.slice(start, start + limit),
        total: filtered.length,
    };
}

export async function getDisputeById(id: string): Promise<Dispute | null> {
    await simulateLatency();
    return mockDisputes.find(d => d.id === id) || null;
}

export async function createDispute(data: Partial<Dispute>): Promise<Dispute> {
    await simulateLatency();
    const newDispute: Dispute = {
        id: `dispute-${Date.now()}`,
        contractId: data.contractId!,
        initiatorId: data.initiatorId!,
        initiatorRole: data.initiatorRole!,
        respondentId: data.respondentId!,
        reason: data.reason!,
        title: data.title!,
        description: data.description!,
        evidence: [],
        disputedAmount: data.disputedAmount!,
        status: 'OPEN',
        timeline: [{
            id: `dt-${Date.now()}`,
            action: 'DISPUTE_OPENED',
            description: 'Dispute opened',
            userId: data.initiatorId!,
            isSystem: false,
            timestamp: new Date(),
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    return newDispute;
}

// -----------------------------------------------------------------------------
// Messaging Services
// -----------------------------------------------------------------------------

export async function getConversations(userId: string): Promise<Conversation[]> {
    await simulateLatency();
    return mockConversations.filter(c =>
        c.participants.some(p => p.userId === userId)
    );
}

export async function getMessages(
    conversationId: string,
    options?: { before?: Date; limit?: number }
): Promise<Message[]> {
    await simulateLatency();
    let messages = mockMessages.filter(m => m.conversationId === conversationId);

    if (options?.before) {
        messages = messages.filter(m => m.createdAt < options.before!);
    }

    const limit = options?.limit || 50;
    return messages.slice(0, limit);
}

export async function sendMessage(
    conversationId: string,
    content: string,
    attachments?: File[]
): Promise<Message> {
    await simulateLatency();
    const newMessage: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        senderId: 'user-1', // Would come from session
        type: 'TEXT',
        content,
        attachments: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
    };
    return newMessage;
}

// -----------------------------------------------------------------------------
// Admin Services
// -----------------------------------------------------------------------------

export async function getPlatformStats(): Promise<PlatformStats> {
    await simulateLatency();
    return mockPlatformStats;
}

export async function banUser(userId: string, reason: string): Promise<User> {
    await simulateLatency();
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return { ...user, isBanned: true, banReason: reason };
}

export async function unbanUser(userId: string): Promise<User> {
    await simulateLatency();
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return { ...user, isBanned: false, banReason: undefined };
}

// -----------------------------------------------------------------------------
// Reference Data Services
// -----------------------------------------------------------------------------

export async function getCategories() {
    await simulateLatency();
    return jobCategories;
}

export async function getSkillsList() {
    await simulateLatency();
    return skillsList;
}

// -----------------------------------------------------------------------------
// Form Validation Helpers
// -----------------------------------------------------------------------------

export function validateJobForm(data: Partial<JobPostFormData>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.title || data.title.length < 10) {
        errors.title = 'Title must be at least 10 characters';
    }
    if (!data.description || data.description.length < 100) {
        errors.description = 'Description must be at least 100 characters';
    }
    if (!data.category) {
        errors.category = 'Please select a category';
    }
    if (!data.skills || data.skills.length === 0) {
        errors.skills = 'Please add at least one skill';
    }
    if (!data.budgetMin || data.budgetMin <= 0) {
        errors.budgetMin = 'Please enter a minimum budget';
    }
    if (!data.budgetMax || data.budgetMax <= 0) {
        errors.budgetMax = 'Please enter a maximum budget';
    }
    if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
        errors.budgetMax = 'Maximum budget must be greater than minimum';
    }

    return errors;
}

export function validateProposalForm(data: Partial<ProposalFormData>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.coverLetter || data.coverLetter.length < 100) {
        errors.coverLetter = 'Cover letter must be at least 100 characters';
    }
    if (!data.proposedRate || data.proposedRate <= 0) {
        errors.proposedRate = 'Please enter your proposed rate';
    }
    if (!data.estimatedDuration) {
        errors.estimatedDuration = 'Please provide an estimated duration';
    }

    return errors;
}
