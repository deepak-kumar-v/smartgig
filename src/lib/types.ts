// =============================================================================
// SmartGIG Platform - Complete TypeScript Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Base Types & Enums
// -----------------------------------------------------------------------------

export type UserRole = 'FREELANCER' | 'CLIENT' | 'ADMIN';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'NOT_AVAILABLE';
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type LanguageLevel = 'BASIC' | 'CONVERSATIONAL' | 'FLUENT' | 'NATIVE';

export type JobStatus = 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type JobType = 'ONE_TIME' | 'ONGOING';
export type BudgetType = 'FIXED' | 'HOURLY';
export type ExperienceLevel = 'ENTRY' | 'INTERMEDIATE' | 'EXPERT';
export type JobVisibility = 'PUBLIC' | 'INVITE_ONLY';

export type ProposalStatus = 'PENDING' | 'SHORTLISTED' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type ContractStatus = 'DRAFT' | 'PENDING_DEPOSIT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'PAID';

export type EscrowStatus = 'PENDING_DEPOSIT' | 'FUNDED' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
export type TransactionType = 'DEPOSIT' | 'RELEASE' | 'REFUND' | 'FEE' | 'WITHDRAWAL';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'EVIDENCE_REQUESTED' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
export type DisputeReason = 'NON_DELIVERY' | 'QUALITY_ISSUES' | 'SCOPE_CREEP' | 'COMMUNICATION' | 'PAYMENT_DISPUTE' | 'OTHER';
export type DisputeOutcome = 'FREELANCER_FAVORED' | 'CLIENT_FAVORED' | 'SPLIT_DECISION' | 'MUTUAL_AGREEMENT' | 'NO_RESOLUTION';

export type StrikeSeverity = 1 | 2 | 3 | 4 | 5; // 1=Warning, 5=Critical
export type AppealStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM' | 'MILESTONE_UPDATE' | 'CONTRACT_UPDATE';

// -----------------------------------------------------------------------------
// User & Profile Types
// -----------------------------------------------------------------------------

export interface User {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    image?: string;
    role: UserRole;
    trustScore: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: VerificationStatus;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
    isActive: boolean;
    isBanned: boolean;
    banReason?: string;
}

export interface FreelancerProfile {
    id: string;
    userId: string;
    user?: User;

    // Professional Info
    headline: string;
    bio: string;
    hourlyRate: number;
    currency: string;

    // Location & Availability
    country: string;
    city?: string;
    timezone: string;
    availability: AvailabilityStatus;
    weeklyHours: number; // Max hours available per week

    // Skills & Expertise
    skills: Skill[];
    categories: string[];
    experienceLevel: ExperienceLevel;

    // Languages
    languages: Language[];

    // Education & Experience
    education: Education[];
    employment: Employment[];
    certifications: Certification[];

    // Portfolio
    portfolio: PortfolioItem[];

    // Social Links
    socialLinks: SocialLink[];

    // Stats
    totalEarnings: number;
    completedJobs: number;
    ongoingJobs: number;
    successRate: number;
    responseTime: number; // Average in hours

    // Reputation
    reputation?: Reputation;

    createdAt: Date;
    updatedAt: Date;
}

export interface ClientProfile {
    id: string;
    userId: string;
    user?: User;

    // Employer Profile (User specific context)
    employerRole?: string; // e.g. "HR Manager", "CEO", "Project Owner"
    languages?: Language[];

    // Company Info
    companyName?: string;
    companyWebsite?: string;
    industry?: string;
    companySize?: string; // '1-10', '11-50', '51-200', '201-500', '500+'
    companyDescription?: string;
    companyLogo?: string;
    estYear?: number;

    // Preferences
    hiringPreferences?: string[]; // e.g. ["Remote Only", "Fixed Price", "Expert Level"]

    // Location
    country: string;
    city?: string;
    timezone: string;

    // Billing
    billingAddress?: Address;
    taxId?: string; // VAT/GST/EIN
    invoiceEmail?: string;
    paymentMethods: PaymentMethod[];

    // Stats
    totalSpent: number;
    activeJobs: number;
    completedJobs: number;
    totalHires: number;

    // Verification
    companyVerified: boolean;
    identityVerified: VerificationStatus; // Mirror user status for easier access
    emailVerified: boolean;
    phoneVerified: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export interface Skill {
    id: string;
    name: string;
    proficiency: ProficiencyLevel;
    yearsOfExperience?: number;
    isVerified: boolean;
}

export interface Language {
    code: string;
    name: string;
    level: LanguageLevel;
}

export interface Education {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear?: number;
    current: boolean;
    description?: string;
}

export interface Employment {
    id: string;
    company: string;
    title: string;
    location?: string;
    startDate: Date;
    endDate?: Date;
    current: boolean;
    description?: string;
}

export interface Certification {
    id: string;
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialId?: string;
    credentialUrl?: string;
    isVerified: boolean;
}

export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    category: string;
    images: string[];
    projectUrl?: string;
    skills: string[];
    completedAt?: Date;
    isVerified: boolean;
    clientTestimonial?: string;
}

export interface SocialLink {
    platform: 'linkedin' | 'github' | 'twitter' | 'dribbble' | 'behance' | 'website' | 'other';
    url: string;
}

export interface Address {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

export interface PaymentMethod {
    id: string;
    type: 'card' | 'bank' | 'paypal';
    last4?: string;
    brand?: string;
    isDefault: boolean;
    expiryMonth?: number;
    expiryYear?: number;
}

// -----------------------------------------------------------------------------
// Job Types
// -----------------------------------------------------------------------------

export interface Job {
    id: string;
    clientId: string;
    client?: ClientProfile;

    // Basic Info
    title: string;
    description: string;
    category: string;
    subcategory?: string;

    // Requirements
    skills: string[];
    experienceLevel: ExperienceLevel;

    // Budget
    budgetType: BudgetType;
    budgetMin: number;
    budgetMax: number;

    // Timeline
    projectType: JobType;
    duration?: string; // '1 week', '1-3 months', etc.
    weeklyHours?: number; // For hourly projects
    startDate?: Date;
    deadline?: Date;

    // Location
    isRemote: boolean;
    locationRestrictions?: string[]; // Country codes

    // Settings
    visibility: JobVisibility;
    allowTrialTask: boolean;
    contractToHire: boolean;

    // Screening
    screeningQuestions: ScreeningQuestion[];

    // Attachments
    attachments: Attachment[];

    // Status
    status: JobStatus;

    // Stats
    proposalCount: number;
    viewCount: number;
    invitesSent: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    closedAt?: Date;
}

export interface ServiceListing {
    id: string;
    freelancerId: string;
    title: string;
    category: string;
    subcategory: string;
    tags: string[];
    description: string;

    // Packages
    packages: ServicePackage[];

    // Requirements
    requirements: ServiceRequirement[];

    // FAQs
    faqs: ServiceFAQ[];

    // Media
    coverImage: string;
    galleryImages: string[];
    videoLink?: string;

    status: 'DRAFT' | 'PUBLISHED' | 'PAUSED';
    createdAt: Date;
    updatedAt: Date;
}

export interface ServicePackage {
    name: 'Basic' | 'Standard' | 'Premium';
    description: string;
    price: number;
    deliveryDays: number;
    revisions: number; // -1 for unlimited
    features: string[]; // Custom list or IDs
}

export interface ServiceRequirement {
    question: string;
    type: 'text' | 'file' | 'multiple_choice';
    required: boolean;
}

export interface ServiceFAQ {
    question: string;
    answer: string;
}

export interface ScreeningQuestion {
    id: string;
    question: string;
    type: 'text' | 'yesno' | 'choice';
    options?: string[]; // For choice type
    required: boolean;
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
}

// -----------------------------------------------------------------------------
// Proposal Types
// -----------------------------------------------------------------------------

export interface Proposal {
    id: string;
    jobId: string;
    job?: Job;
    freelancerId: string;
    freelancer?: FreelancerProfile;

    // Content
    coverLetter: string;
    proposedRate: number;
    estimatedDuration: string;

    // Milestones
    proposedMilestones: ProposedMilestone[];

    // Work Samples
    relevantPortfolio: string[]; // PortfolioItem IDs
    additionalAttachments: Attachment[];

    // Trial Task
    acceptsTrialTask: boolean;
    trialTaskProposal?: string;

    // Screening Answers
    screeningAnswers: ScreeningAnswer[];

    // Status
    status: ProposalStatus;

    // Client Actions
    isShortlisted: boolean;
    clientNotes?: string;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date;
    viewedAt?: Date;
    respondedAt?: Date;
}

export interface ProposedMilestone {
    title: string;
    description: string;
    amount: number;
    duration: string;
}

export interface ScreeningAnswer {
    questionId: string;
    answer: string;
}

// -----------------------------------------------------------------------------
// Contract Types
// -----------------------------------------------------------------------------

export interface Contract {
    id: string;
    jobId?: string;
    job?: Job;
    proposalId?: string;
    proposal?: Proposal;

    // Parties
    clientId: string;
    client?: ClientProfile;
    freelancerId: string;
    freelancer?: FreelancerProfile;

    // Terms
    title: string;
    description: string;
    contractType: BudgetType;
    totalAmount: number;
    hourlyRate?: number;

    // Milestones
    milestones: Milestone[];

    // Timeline
    startDate: Date;
    endDate?: Date;

    // Status
    status: ContractStatus;

    // Escrow
    escrowAccount?: EscrowAccount;

    // Activity
    activityLog: ActivityLogEntry[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface Milestone {
    id: string;
    contractId: string;

    // Details
    title: string;
    description: string;
    amount: number;

    // Timeline
    dueDate?: Date;

    // Deliverables
    deliverables: Deliverable[];

    // Status
    status: MilestoneStatus;

    // Revisions
    revisionCount: number;
    maxRevisions: number;
    revisionRequests: RevisionRequest[];

    // Timestamps
    createdAt: Date;
    startedAt?: Date;
    submittedAt?: Date;
    approvedAt?: Date;
    paidAt?: Date;
}

export interface Deliverable {
    id: string;
    title: string;
    description?: string;
    attachments: Attachment[];
    submittedAt: Date;
}

export interface RevisionRequest {
    id: string;
    reason: string;
    details: string;
    requestedAt: Date;
    resolvedAt?: Date;
}

export interface ActivityLogEntry {
    id: string;
    action: string;
    description: string;
    userId: string;
    userName: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Escrow & Payment Types
// -----------------------------------------------------------------------------

export interface EscrowAccount {
    id: string;
    contractId: string;

    // Amounts
    totalDeposited: number;
    totalReleased: number;
    totalRefunded: number;
    currentBalance: number;
    platformFee: number;

    // Status
    status: EscrowStatus;

    // Transactions
    transactions: Transaction[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface Transaction {
    id: string;
    escrowAccountId?: string;
    userId: string;

    // Details
    type: TransactionType;
    amount: number;
    currency: string;
    description: string;

    // References
    milestoneId?: string;
    invoiceId?: string;

    // Status
    status: TransactionStatus;

    // Payment Details
    paymentMethod?: string;
    transactionRef?: string;

    // Timestamps
    createdAt: Date;
    processedAt?: Date;
}

export interface Invoice {
    id: string;
    contractId: string;
    milestoneId?: string;

    // Parties
    fromUserId: string;
    toUserId: string;

    // Details
    invoiceNumber: string;
    description: string;
    lineItems: InvoiceLineItem[];
    subtotal: number;
    fees: number;
    total: number;
    currency: string;

    // Status
    status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

    // Dates
    issueDate: Date;
    dueDate: Date;
    paidAt?: Date;

    // Timestamps
    createdAt: Date;
}

export interface InvoiceLineItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

// -----------------------------------------------------------------------------
// Dispute Types
// -----------------------------------------------------------------------------

export interface Dispute {
    id: string;
    contractId: string;
    contract?: Contract;
    milestoneId?: string;

    // Parties
    initiatorId: string;
    initiatorRole: 'CLIENT' | 'FREELANCER';
    respondentId: string;

    // Details
    reason: DisputeReason;
    title: string;
    description: string;

    // Evidence
    evidence: DisputeEvidence[];

    // Amount in dispute
    disputedAmount: number;

    // Status
    status: DisputeStatus;
    outcome?: DisputeOutcome;
    resolution?: string;

    // Admin
    assignedAdminId?: string;

    // Timeline
    timeline: DisputeTimelineEntry[];

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
}

export interface DisputeEvidence {
    id: string;
    disputeId: string;
    userId: string;

    title: string;
    description: string;
    attachments: Attachment[];

    submittedAt: Date;
}

export interface DisputeTimelineEntry {
    id: string;
    action: string;
    description: string;
    userId?: string;
    isSystem: boolean;
    timestamp: Date;
}

// -----------------------------------------------------------------------------
// Strike & Moderation Types
// -----------------------------------------------------------------------------

export interface Strike {
    id: string;
    userId: string;
    user?: User;

    // Details
    reason: string;
    description: string;
    severity: StrikeSeverity;

    // Source
    disputeId?: string;
    reportId?: string;

    // Status
    isActive: boolean;
    expiresAt: Date;

    // Appeals
    appeals: Appeal[];

    // Admin
    issuedBy: string;

    // Timestamps
    createdAt: Date;
}

export interface Appeal {
    id: string;
    strikeId: string;
    userId: string;

    // Content
    reason: string;
    evidence: Attachment[];

    // Status
    status: AppealStatus;
    adminResponse?: string;

    // Admin
    reviewedBy?: string;

    // Timestamps
    createdAt: Date;
    reviewedAt?: Date;
}

// -----------------------------------------------------------------------------
// Reputation & Review Types
// -----------------------------------------------------------------------------

export interface Reputation {
    id: string;
    freelancerId: string;

    // Overall
    overallScore: number;
    totalReviews: number;

    // Dimensional Scores (0-100)
    qualityScore: number;
    communicationScore: number;
    timelinessScore: number;
    cooperationScore: number;

    // Trend
    scoreTrend: 'UP' | 'DOWN' | 'STABLE';

    // Updated
    updatedAt: Date;
}

export interface Review {
    id: string;
    contractId: string;

    // Reviewer
    reviewerId: string;
    reviewerRole: 'CLIENT' | 'FREELANCER';

    // Reviewee
    revieweeId: string;

    // Ratings
    overallRating: number; // 1-5
    qualityRating?: number;
    communicationRating?: number;
    timelinessRating?: number;
    cooperationRating?: number;

    // Content
    title?: string;
    content: string;

    // Response
    response?: string;
    respondedAt?: Date;

    // Visibility
    isPublic: boolean;

    // Timestamps
    createdAt: Date;
}

// -----------------------------------------------------------------------------
// Communication Types
// -----------------------------------------------------------------------------

export interface Conversation {
    id: string;

    // Context
    contractId?: string;
    proposalId?: string;
    jobId?: string;

    // Participants
    participants: ConversationParticipant[];

    // Last Message
    lastMessage?: Message;
    lastMessageAt: Date;

    // Status
    isArchived: boolean;

    // Timestamps
    createdAt: Date;
}

export interface ConversationParticipant {
    userId: string;
    user?: User;
    unreadCount: number;
    lastReadAt?: Date;
    joinedAt: Date;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender?: User;

    // Content
    type: MessageType;
    content: string;
    attachments: Attachment[];

    // Metadata
    metadata?: Record<string, unknown>;

    // Status
    isEdited: boolean;
    isDeleted: boolean;

    // Timestamps
    createdAt: Date;
    editedAt?: Date;
}

// -----------------------------------------------------------------------------
// Admin & Analytics Types
// -----------------------------------------------------------------------------

export interface PlatformStats {
    // Users
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    freelancerCount: number;
    clientCount: number;

    // Jobs
    totalJobs: number;
    activeJobs: number;
    newJobsToday: number;

    // Contracts
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;

    // Finances
    totalTransactionVolume: number;
    escrowBalance: number;
    platformRevenue: number;

    // Disputes
    openDisputes: number;
    resolvedDisputes: number;

    // Strikes
    activeStrikes: number;
    bannedUsers: number;
}

// -----------------------------------------------------------------------------
// Form State Types (for multi-step forms)
// -----------------------------------------------------------------------------

export interface JobPostFormData {
    // Step 1: Basic Info
    title: string;
    category: string;
    subcategory: string;
    description: string;
    attachments?: File[];

    // Step 2: Requirements
    skills: string[];
    experienceLevel: ExperienceLevel;

    // Step 3: Budget
    budgetType: BudgetType;
    budgetMin: number;
    budgetMax: number;

    // Step 4: Timeline
    projectType: JobType;
    duration: string;
    weeklyHours?: number;
    startDate?: Date;
    deadline?: Date;

    // Step 5: Screening
    screeningQuestions: Omit<ScreeningQuestion, 'id'>[];

    // Step 6: Settings
    visibility: JobVisibility;
    isRemote: boolean;
    locationRestrictions: string[];
    allowTrialTask: boolean;
    contractToHire: boolean;
}

export interface ProposalFormData {
    coverLetter: string;
    proposedRate: number;
    estimatedDuration: string;
    proposedMilestones: Omit<ProposedMilestone, 'id'>[];
    relevantPortfolio: string[];
    additionalAttachments: File[];
    acceptsTrialTask: boolean;
    trialTaskProposal?: string;
    screeningAnswers: Record<string, string>;
}

export interface FreelancerProfileFormData {
    // Personal
    displayName: string;
    headline: string;
    bio: string;

    // Location
    country: string;
    city: string;
    timezone: string;

    // Rate & Availability
    hourlyRate: number;
    currency: string;
    availability: AvailabilityStatus;
    weeklyHours: number;

    // Skills
    skills: Omit<Skill, 'id' | 'isVerified'>[];
    categories: string[];
    experienceLevel: ExperienceLevel;

    // Languages
    languages: Language[];

    // Education
    education: Omit<Education, 'id'>[];

    // Employment
    employment: Omit<Employment, 'id'>[];

    // Certifications
    certifications: Omit<Certification, 'id' | 'isVerified'>[];

    // Social
    socialLinks: SocialLink[];
}
