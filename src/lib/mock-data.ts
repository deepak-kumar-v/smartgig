// =============================================================================
// SmartGIG Platform - Mock Data
// Realistic sample data for all entities
// =============================================================================

import type {
    User, FreelancerProfile, ClientProfile, Job, Proposal, Contract,
    Milestone, EscrowAccount, Transaction, Dispute, Strike, Review,
    Conversation, Message, PlatformStats, Reputation, PortfolioItem, ServiceListing
} from './types';

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export const mockUsers: User[] = [
    {
        id: 'user-1',
        email: 'david.kim@email.com',
        name: 'David Kim',
        displayName: 'David K.',
        image: '/avatars/david.jpg',
        role: 'FREELANCER',
        trustScore: 98,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: 'VERIFIED',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2025-01-18'),
        lastActiveAt: new Date('2025-01-19'),
        isActive: true,
        isBanned: false,
    },
    {
        id: 'user-2',
        email: 'sarah.chen@techcorp.com',
        name: 'Sarah Chen',
        displayName: 'Sarah C.',
        image: '/avatars/sarah.jpg',
        role: 'CLIENT',
        trustScore: 95,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: 'VERIFIED',
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2025-01-17'),
        lastActiveAt: new Date('2025-01-19'),
        isActive: true,
        isBanned: false,
    },
    {
        id: 'user-3',
        email: 'alex.rivera@email.com',
        name: 'Alex Rivera',
        displayName: 'Alex R.',
        image: '/avatars/alex.jpg',
        role: 'FREELANCER',
        trustScore: 92,
        emailVerified: true,
        phoneVerified: false,
        identityVerified: 'PENDING',
        createdAt: new Date('2024-06-10'),
        updatedAt: new Date('2025-01-16'),
        lastActiveAt: new Date('2025-01-18'),
        isActive: true,
        isBanned: false,
    },
    {
        id: 'user-4',
        email: 'emily.watson@startup.io',
        name: 'Emily Watson',
        displayName: 'Emily W.',
        image: '/avatars/emily.jpg',
        role: 'CLIENT',
        trustScore: 88,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: 'VERIFIED',
        createdAt: new Date('2024-08-05'),
        updatedAt: new Date('2025-01-15'),
        lastActiveAt: new Date('2025-01-19'),
        isActive: true,
        isBanned: false,
    },
    {
        id: 'admin-1',
        email: 'admin@smartgig.com',
        name: 'Admin User',
        role: 'ADMIN',
        trustScore: 100,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: 'VERIFIED',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2025-01-19'),
        lastActiveAt: new Date('2025-01-19'),
        isActive: true,
        isBanned: false,
    },
];

// -----------------------------------------------------------------------------
// Freelancer Profiles
// -----------------------------------------------------------------------------

export const mockFreelancerProfiles: FreelancerProfile[] = [
    {
        id: 'fp-1',
        userId: 'user-1',
        user: mockUsers[0],
        headline: 'Senior Full-Stack Developer | React & Node.js Expert',
        bio: `With over 8 years of experience in web development, I specialize in building scalable applications using modern technologies. I've worked with Fortune 500 companies and fast-growing startups alike, delivering high-quality solutions on time and within budget.

My expertise includes React, Next.js, Node.js, TypeScript, and cloud services (AWS, GCP). I'm passionate about clean code, performance optimization, and creating exceptional user experiences.`,
        hourlyRate: 85,
        currency: 'USD',
        country: 'United States',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
        availability: 'AVAILABLE',
        weeklyHours: 40,
        skills: [
            { id: 's1', name: 'React', proficiency: 'EXPERT', yearsOfExperience: 6, isVerified: true },
            { id: 's2', name: 'TypeScript', proficiency: 'EXPERT', yearsOfExperience: 5, isVerified: true },
            { id: 's3', name: 'Node.js', proficiency: 'EXPERT', yearsOfExperience: 7, isVerified: true },
            { id: 's4', name: 'Next.js', proficiency: 'ADVANCED', yearsOfExperience: 4, isVerified: true },
            { id: 's5', name: 'PostgreSQL', proficiency: 'ADVANCED', yearsOfExperience: 5, isVerified: false },
            { id: 's6', name: 'AWS', proficiency: 'INTERMEDIATE', yearsOfExperience: 3, isVerified: false },
        ],
        categories: ['Web Development', 'Mobile Development', 'API Development'],
        experienceLevel: 'EXPERT',
        languages: [
            { code: 'en', name: 'English', level: 'NATIVE' },
            { code: 'ko', name: 'Korean', level: 'FLUENT' },
        ],
        education: [
            {
                id: 'edu-1',
                institution: 'Stanford University',
                degree: 'Master of Science',
                fieldOfStudy: 'Computer Science',
                startYear: 2014,
                endYear: 2016,
                current: false,
            },
            {
                id: 'edu-2',
                institution: 'UC Berkeley',
                degree: 'Bachelor of Science',
                fieldOfStudy: 'Computer Science',
                startYear: 2010,
                endYear: 2014,
                current: false,
            },
        ],
        employment: [
            {
                id: 'emp-1',
                company: 'Google',
                title: 'Senior Software Engineer',
                location: 'Mountain View, CA',
                startDate: new Date('2018-03-01'),
                endDate: new Date('2022-12-31'),
                current: false,
                description: 'Led development of internal tools serving 50,000+ employees.',
            },
            {
                id: 'emp-2',
                company: 'Stripe',
                title: 'Software Engineer',
                location: 'San Francisco, CA',
                startDate: new Date('2016-06-01'),
                endDate: new Date('2018-02-28'),
                current: false,
                description: 'Built payment processing features handling millions of transactions.',
            },
        ],
        certifications: [
            {
                id: 'cert-1',
                name: 'AWS Solutions Architect',
                issuingOrganization: 'Amazon Web Services',
                issueDate: new Date('2023-06-15'),
                expirationDate: new Date('2026-06-15'),
                credentialId: 'AWS-SA-2023-DK',
                isVerified: true,
            },
        ],
        portfolio: [
            {
                id: 'port-1',
                title: 'E-Commerce Platform',
                description: 'Built a complete e-commerce solution with real-time inventory, payment processing, and admin dashboard.',
                category: 'Web Development',
                images: ['/portfolio/ecom-1.jpg', '/portfolio/ecom-2.jpg'],
                projectUrl: 'https://example-ecom.com',
                skills: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
                completedAt: new Date('2024-08-15'),
                isVerified: true,
                clientTestimonial: 'David delivered exceptional work. The platform exceeded our expectations.',
            },
            {
                id: 'port-2',
                title: 'SaaS Dashboard',
                description: 'Designed and developed a comprehensive analytics dashboard with real-time data visualization.',
                category: 'Web Development',
                images: ['/portfolio/saas-1.jpg'],
                skills: ['Next.js', 'TypeScript', 'D3.js', 'Tailwind'],
                completedAt: new Date('2024-11-20'),
                isVerified: true,
            },
        ],
        socialLinks: [
            { platform: 'github', url: 'https://github.com/davidkim' },
            { platform: 'linkedin', url: 'https://linkedin.com/in/davidkim' },
            { platform: 'twitter', url: 'https://twitter.com/davidkim' },
        ],
        totalEarnings: 285000,
        completedJobs: 47,
        ongoingJobs: 2,
        successRate: 98,
        responseTime: 2,
        reputation: {
            id: 'rep-1',
            freelancerId: 'fp-1',
            overallScore: 98,
            totalReviews: 45,
            qualityScore: 99,
            communicationScore: 97,
            timelinessScore: 96,
            cooperationScore: 98,
            scoreTrend: 'STABLE',
            updatedAt: new Date('2025-01-18'),
        },
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2025-01-18'),
    },
    {
        id: 'fp-2',
        userId: 'user-3',
        user: mockUsers[2],
        headline: 'UI/UX Designer | Brand Identity Specialist',
        bio: `Creative designer with 5+ years of experience crafting beautiful, user-centric digital experiences. I blend aesthetics with functionality to create designs that not only look great but also drive results.`,
        hourlyRate: 65,
        currency: 'USD',
        country: 'Canada',
        city: 'Toronto',
        timezone: 'America/Toronto',
        availability: 'AVAILABLE',
        weeklyHours: 35,
        skills: [
            { id: 's10', name: 'Figma', proficiency: 'EXPERT', yearsOfExperience: 5, isVerified: true },
            { id: 's11', name: 'UI Design', proficiency: 'EXPERT', yearsOfExperience: 5, isVerified: true },
            { id: 's12', name: 'UX Research', proficiency: 'ADVANCED', yearsOfExperience: 4, isVerified: false },
            { id: 's13', name: 'Prototyping', proficiency: 'EXPERT', yearsOfExperience: 5, isVerified: true },
        ],
        categories: ['UI/UX Design', 'Brand Identity', 'Web Design'],
        experienceLevel: 'EXPERT',
        languages: [
            { code: 'en', name: 'English', level: 'NATIVE' },
            { code: 'es', name: 'Spanish', level: 'CONVERSATIONAL' },
        ],
        education: [],
        employment: [],
        certifications: [],
        portfolio: [],
        socialLinks: [],
        totalEarnings: 142000,
        completedJobs: 32,
        ongoingJobs: 1,
        successRate: 95,
        responseTime: 4,
        createdAt: new Date('2024-06-10'),
        updatedAt: new Date('2025-01-16'),
    },
];

// -----------------------------------------------------------------------------
// Client Profiles
// -----------------------------------------------------------------------------

export const mockClientProfiles: ClientProfile[] = [
    {
        id: 'cp-1',
        userId: 'user-2',
        user: mockUsers[1],
        companyName: 'TechCorp Solutions',
        companyWebsite: 'https://techcorp.com',
        industry: 'Technology',
        companySize: '51-200',
        companyDescription: 'Leading provider of enterprise software solutions.',
        country: 'United States',
        city: 'New York',
        timezone: 'America/New_York',
        paymentMethods: [
            { id: 'pm-1', type: 'card', last4: '4242', brand: 'Visa', isDefault: true, expiryMonth: 12, expiryYear: 2026 },
        ],
        totalSpent: 156000,
        activeJobs: 3,
        completedJobs: 28,
        totalHires: 35,
        companyVerified: true,
        identityVerified: 'VERIFIED',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2025-01-17'),
    },
    {
        id: 'cp-2',
        userId: 'user-4',
        user: mockUsers[3],
        companyName: 'Startup.io',
        companyWebsite: 'https://startup.io',
        industry: 'FinTech',
        companySize: '11-50',
        companyDescription: 'Innovative fintech startup revolutionizing payments.',
        country: 'United Kingdom',
        city: 'London',
        timezone: 'Europe/London',
        paymentMethods: [
            { id: 'pm-2', type: 'card', last4: '1234', brand: 'Mastercard', isDefault: true, expiryMonth: 8, expiryYear: 2025 },
        ],
        totalSpent: 45000,
        activeJobs: 2,
        completedJobs: 8,
        totalHires: 12,
        companyVerified: true,
        identityVerified: 'VERIFIED',
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date('2024-08-05'),
        updatedAt: new Date('2025-01-15'),
    },
];

// -----------------------------------------------------------------------------
// Jobs
// -----------------------------------------------------------------------------

export const mockJobs: Job[] = [
    {
        id: 'job-1',
        clientId: 'cp-1',
        client: mockClientProfiles[0],
        title: 'Senior React Developer for E-Commerce Platform',
        description: `We're looking for an experienced React developer to help build and maintain our e-commerce platform.

**Responsibilities:**
- Develop new features using React and TypeScript
- Optimize application performance
- Write clean, maintainable code
- Collaborate with designers and backend team
- Participate in code reviews

**Requirements:**
- 5+ years of React experience
- Strong TypeScript skills
- Experience with state management (Redux, Zustand)
- Familiarity with Next.js is a plus`,
        category: 'Web Development',
        subcategory: 'Frontend Development',
        skills: ['React', 'TypeScript', 'Next.js', 'Redux', 'Tailwind CSS'],
        experienceLevel: 'EXPERT',
        budgetType: 'HOURLY',
        budgetMin: 60,
        budgetMax: 100,
        projectType: 'ONGOING',
        duration: '3-6 months',
        weeklyHours: 30,
        isRemote: true,
        visibility: 'PUBLIC',
        allowTrialTask: true,
        contractToHire: true,
        screeningQuestions: [
            { id: 'sq-1', question: 'How many years of React experience do you have?', type: 'text', required: true },
            { id: 'sq-2', question: 'Have you worked on e-commerce platforms before?', type: 'yesno', required: true },
            { id: 'sq-3', question: 'What is your availability to start?', type: 'choice', options: ['Immediately', 'Within 1 week', 'Within 2 weeks', 'More than 2 weeks'], required: true },
        ],
        attachments: [],
        status: 'OPEN',
        proposalCount: 24,
        viewCount: 156,
        invitesSent: 5,
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-18'),
        publishedAt: new Date('2025-01-10'),
    },
    {
        id: 'job-2',
        clientId: 'cp-2',
        client: mockClientProfiles[1],
        title: 'Mobile App UI/UX Designer for FinTech App',
        description: `We need a talented UI/UX designer to redesign our mobile banking application.

**Project Scope:**
- Audit current app design
- Create user personas and journey maps
- Design new UI with modern aesthetics
- Create interactive prototypes
- Deliver design system and assets

**Deliverables:**
- Figma files with all screens
- Interactive prototype
- Design system documentation
- Asset library`,
        category: 'Design',
        subcategory: 'UI/UX Design',
        skills: ['Figma', 'UI Design', 'UX Research', 'Mobile Design', 'Prototyping'],
        experienceLevel: 'INTERMEDIATE',
        budgetType: 'FIXED',
        budgetMin: 8000,
        budgetMax: 12000,
        projectType: 'ONE_TIME',
        duration: '4-6 weeks',
        isRemote: true,
        visibility: 'PUBLIC',
        allowTrialTask: false,
        contractToHire: false,
        screeningQuestions: [
            { id: 'sq-4', question: 'Please share 2-3 relevant mobile app designs from your portfolio.', type: 'text', required: true },
            { id: 'sq-5', question: 'Do you have experience with fintech or banking apps?', type: 'yesno', required: true },
        ],
        attachments: [],
        status: 'OPEN',
        proposalCount: 18,
        viewCount: 98,
        invitesSent: 3,
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-17'),
        publishedAt: new Date('2025-01-12'),
    },
    {
        id: 'job-3',
        clientId: 'cp-1',
        client: mockClientProfiles[0],
        title: 'Backend API Development - Node.js',
        description: `Looking for a Node.js developer to build RESTful APIs for our platform.`,
        category: 'Web Development',
        subcategory: 'Backend Development',
        skills: ['Node.js', 'Express', 'PostgreSQL', 'REST API', 'Docker'],
        experienceLevel: 'INTERMEDIATE',
        budgetType: 'FIXED',
        budgetMin: 5000,
        budgetMax: 8000,
        projectType: 'ONE_TIME',
        duration: '2-4 weeks',
        isRemote: true,
        visibility: 'PUBLIC',
        allowTrialTask: true,
        contractToHire: false,
        screeningQuestions: [],
        attachments: [],
        status: 'IN_PROGRESS',
        proposalCount: 32,
        viewCount: 210,
        invitesSent: 0,
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-15'),
        publishedAt: new Date('2025-01-05'),
    },
];

// -----------------------------------------------------------------------------
// Proposals
// -----------------------------------------------------------------------------

export const mockProposals: Proposal[] = [
    {
        id: 'prop-1',
        jobId: 'job-1',
        job: mockJobs[0],
        freelancerId: 'fp-1',
        freelancer: mockFreelancerProfiles[0],
        coverLetter: `Dear Hiring Manager,

I'm excited to apply for the Senior React Developer position. With 8+ years of experience building high-performance web applications, including extensive work on e-commerce platforms, I believe I'm an excellent fit for this role.

In my previous role at a Fortune 500 company, I led the frontend development of an e-commerce platform that processed over $50M in transactions annually. I'm well-versed in React, TypeScript, and Next.js, and I'm passionate about creating exceptional user experiences.

I'd love to discuss how I can contribute to your team. I'm available for a trial task to demonstrate my skills.

Best regards,
David Kim`,
        proposedRate: 85,
        estimatedDuration: '4 months',
        proposedMilestones: [
            { title: 'Project Setup & Architecture', description: 'Set up development environment, CI/CD, and define architecture', amount: 2000, duration: '1 week' },
            { title: 'Core Features Development', description: 'Build main e-commerce features', amount: 8000, duration: '6 weeks' },
            { title: 'Testing & Optimization', description: 'QA, performance optimization, and bug fixes', amount: 2000, duration: '2 weeks' },
        ],
        relevantPortfolio: ['port-1', 'port-2'],
        additionalAttachments: [],
        acceptsTrialTask: true,
        trialTaskProposal: 'I can build a sample product listing page with filtering and cart functionality.',
        screeningAnswers: [
            { questionId: 'sq-1', answer: '8 years' },
            { questionId: 'sq-2', answer: 'Yes' },
            { questionId: 'sq-3', answer: 'Immediately' },
        ],
        status: 'SHORTLISTED',
        isShortlisted: true,
        clientNotes: 'Strong candidate - schedule interview',
        createdAt: new Date('2025-01-11'),
        updatedAt: new Date('2025-01-16'),
        submittedAt: new Date('2025-01-11'),
        viewedAt: new Date('2025-01-12'),
    },
];

// -----------------------------------------------------------------------------
// Contracts
// -----------------------------------------------------------------------------

export const mockContracts: Contract[] = [
    {
        id: 'contract-1',
        jobId: 'job-3',
        clientId: 'cp-1',
        client: mockClientProfiles[0],
        freelancerId: 'fp-1',
        freelancer: mockFreelancerProfiles[0],
        title: 'Backend API Development - Node.js',
        description: 'Development of RESTful APIs for the TechCorp platform.',
        contractType: 'FIXED',
        totalAmount: 6500,
        milestones: [
            {
                id: 'ms-1',
                contractId: 'contract-1',
                title: 'API Design & Documentation',
                description: 'Design API endpoints and create OpenAPI documentation',
                amount: 1500,
                dueDate: new Date('2025-01-20'),
                deliverables: [],
                status: 'APPROVED',
                revisionCount: 0,
                maxRevisions: 2,
                revisionRequests: [],
                createdAt: new Date('2025-01-08'),
                startedAt: new Date('2025-01-08'),
                submittedAt: new Date('2025-01-12'),
                approvedAt: new Date('2025-01-13'),
                paidAt: new Date('2025-01-13'),
            },
            {
                id: 'ms-2',
                contractId: 'contract-1',
                title: 'Core API Development',
                description: 'Implement authentication, user management, and core CRUD endpoints',
                amount: 3500,
                dueDate: new Date('2025-02-01'),
                deliverables: [],
                status: 'IN_PROGRESS',
                revisionCount: 0,
                maxRevisions: 2,
                revisionRequests: [],
                createdAt: new Date('2025-01-08'),
                startedAt: new Date('2025-01-14'),
            },
            {
                id: 'ms-3',
                contractId: 'contract-1',
                title: 'Testing & Deployment',
                description: 'Write tests, set up CI/CD, and deploy to staging',
                amount: 1500,
                dueDate: new Date('2025-02-10'),
                deliverables: [],
                status: 'PENDING',
                revisionCount: 0,
                maxRevisions: 2,
                revisionRequests: [],
                createdAt: new Date('2025-01-08'),
            },
        ],
        startDate: new Date('2025-01-08'),
        status: 'ACTIVE',
        activityLog: [
            { id: 'log-1', action: 'CONTRACT_CREATED', description: 'Contract created', userId: 'user-2', userName: 'Sarah Chen', timestamp: new Date('2025-01-08') },
            { id: 'log-2', action: 'MILESTONE_STARTED', description: 'Milestone 1 started', userId: 'user-1', userName: 'David Kim', timestamp: new Date('2025-01-08') },
            { id: 'log-3', action: 'MILESTONE_SUBMITTED', description: 'Milestone 1 submitted for review', userId: 'user-1', userName: 'David Kim', timestamp: new Date('2025-01-12') },
            { id: 'log-4', action: 'MILESTONE_APPROVED', description: 'Milestone 1 approved and paid', userId: 'user-2', userName: 'Sarah Chen', timestamp: new Date('2025-01-13') },
        ],
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-18'),
    },
];

// -----------------------------------------------------------------------------
// Escrow Accounts
// -----------------------------------------------------------------------------

export const mockEscrowAccounts: EscrowAccount[] = [
    {
        id: 'escrow-1',
        contractId: 'contract-1',
        totalDeposited: 6500,
        totalReleased: 1500,
        totalRefunded: 0,
        currentBalance: 5000,
        platformFee: 650,
        status: 'FUNDED',
        transactions: [
            {
                id: 'tx-1',
                escrowAccountId: 'escrow-1',
                userId: 'user-2',
                type: 'DEPOSIT',
                amount: 6500,
                currency: 'USD',
                description: 'Initial escrow deposit for contract',
                status: 'COMPLETED',
                paymentMethod: 'card',
                createdAt: new Date('2025-01-08'),
                processedAt: new Date('2025-01-08'),
            },
            {
                id: 'tx-2',
                escrowAccountId: 'escrow-1',
                userId: 'user-1',
                type: 'RELEASE',
                amount: 1500,
                currency: 'USD',
                description: 'Milestone 1 payment release',
                milestoneId: 'ms-1',
                status: 'COMPLETED',
                createdAt: new Date('2025-01-13'),
                processedAt: new Date('2025-01-13'),
            },
        ],
        createdAt: new Date('2025-01-08'),
        updatedAt: new Date('2025-01-13'),
    },
];

// -----------------------------------------------------------------------------
// Reviews
// -----------------------------------------------------------------------------

export const mockReviews: Review[] = [
    {
        id: 'review-1',
        contractId: 'contract-prev-1',
        reviewerId: 'user-2',
        reviewerRole: 'CLIENT',
        revieweeId: 'user-1',
        overallRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        timelinessRating: 4,
        cooperationRating: 5,
        title: 'Exceptional developer!',
        content: 'David exceeded all expectations. His code was clean, well-documented, and delivered ahead of schedule. Communication was excellent throughout the project. Highly recommend!',
        isPublic: true,
        createdAt: new Date('2024-12-20'),
    },
    {
        id: 'review-2',
        contractId: 'contract-prev-2',
        reviewerId: 'user-4',
        reviewerRole: 'CLIENT',
        revieweeId: 'user-1',
        overallRating: 5,
        qualityRating: 5,
        communicationRating: 5,
        timelinessRating: 5,
        cooperationRating: 5,
        title: 'Best freelancer I\'ve worked with',
        content: 'The project was complex but David handled it with professionalism. Would definitely work with him again.',
        isPublic: true,
        createdAt: new Date('2024-11-15'),
    },
];

// -----------------------------------------------------------------------------
// Disputes
// -----------------------------------------------------------------------------

export const mockDisputes: Dispute[] = [
    {
        id: 'dispute-1',
        contractId: 'contract-old-1',
        initiatorId: 'user-4',
        initiatorRole: 'CLIENT',
        respondentId: 'user-3',
        reason: 'QUALITY_ISSUES',
        title: 'Deliverables do not match requirements',
        description: 'The design files submitted do not follow the brand guidelines specified in the contract.',
        evidence: [],
        disputedAmount: 2000,
        status: 'RESOLVED',
        outcome: 'SPLIT_DECISION',
        resolution: 'Freelancer to provide revised designs. Client to release 50% of disputed amount upon revision completion.',
        assignedAdminId: 'admin-1',
        timeline: [
            { id: 'dt-1', action: 'DISPUTE_OPENED', description: 'Dispute opened by client', userId: 'user-4', isSystem: false, timestamp: new Date('2024-12-01') },
            { id: 'dt-2', action: 'EVIDENCE_SUBMITTED', description: 'Client submitted evidence', userId: 'user-4', isSystem: false, timestamp: new Date('2024-12-02') },
            { id: 'dt-3', action: 'ADMIN_ASSIGNED', description: 'Dispute assigned to admin', isSystem: true, timestamp: new Date('2024-12-02') },
            { id: 'dt-4', action: 'RESOLVED', description: 'Dispute resolved with split decision', userId: 'admin-1', isSystem: false, timestamp: new Date('2024-12-05') },
        ],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-05'),
        resolvedAt: new Date('2024-12-05'),
    },
];

// -----------------------------------------------------------------------------
// Platform Stats
// -----------------------------------------------------------------------------

export const mockPlatformStats: PlatformStats = {
    totalUsers: 15420,
    activeUsers: 8750,
    newUsersToday: 47,
    freelancerCount: 10250,
    clientCount: 5170,
    totalJobs: 8900,
    activeJobs: 1250,
    newJobsToday: 32,
    totalContracts: 12500,
    activeContracts: 890,
    completedContracts: 11200,
    totalTransactionVolume: 45000000,
    escrowBalance: 2500000,
    platformRevenue: 4500000,
    openDisputes: 23,
    resolvedDisputes: 456,
    activeStrikes: 45,
    bannedUsers: 89,
};

// -----------------------------------------------------------------------------
// Conversations & Messages
// -----------------------------------------------------------------------------

export const mockConversations: Conversation[] = [
    {
        id: 'conv-1',
        contractId: 'contract-1',
        participants: [
            { userId: 'user-1', unreadCount: 0, lastReadAt: new Date('2025-01-18'), joinedAt: new Date('2025-01-08') },
            { userId: 'user-2', unreadCount: 2, lastReadAt: new Date('2025-01-17'), joinedAt: new Date('2025-01-08') },
        ],
        lastMessageAt: new Date('2025-01-18T14:30:00'),
        isArchived: false,
        createdAt: new Date('2025-01-08'),
    },
];

export const mockMessages: Message[] = [
    {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        type: 'TEXT',
        content: 'Hi Sarah! I\'ve completed the API documentation. Ready for your review.',
        attachments: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date('2025-01-18T14:30:00'),
    },
    {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-2',
        type: 'TEXT',
        content: 'Great work David! I\'ll take a look and get back to you by tomorrow.',
        attachments: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date('2025-01-18T15:45:00'),
    },
];

// -----------------------------------------------------------------------------
// Category Data
// -----------------------------------------------------------------------------

export const jobCategories = [
    { id: 'cat-1', name: 'Web Development', subcategories: ['Frontend', 'Backend', 'Full Stack', 'E-Commerce', 'CMS'] },
    { id: 'cat-2', name: 'Mobile Development', subcategories: ['iOS', 'Android', 'React Native', 'Flutter', 'Cross-Platform'] },
    { id: 'cat-3', name: 'Design', subcategories: ['UI/UX', 'Graphic Design', 'Brand Identity', 'Illustration', '3D Design'] },
    { id: 'cat-4', name: 'Writing', subcategories: ['Content Writing', 'Copywriting', 'Technical Writing', 'Editing', 'Translation'] },
    { id: 'cat-5', name: 'Marketing', subcategories: ['SEO', 'Social Media', 'PPC', 'Email Marketing', 'Content Marketing'] },
    { id: 'cat-6', name: 'Video & Animation', subcategories: ['Video Editing', 'Motion Graphics', '2D Animation', '3D Animation', 'VFX'] },
    { id: 'cat-7', name: 'Data & Analytics', subcategories: ['Data Analysis', 'Machine Learning', 'Data Visualization', 'BI', 'Data Engineering'] },
];

export const skillsList = [
    'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Python', 'Django', 'Flask',
    'Ruby', 'Rails', 'PHP', 'Laravel', 'Java', 'Spring Boot', 'C#', '.NET', 'Go', 'Rust',
    'Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS', 'Android',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'CI/CD',
    'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'After Effects',
    'UI Design', 'UX Design', 'Web Design', 'Mobile Design', 'Branding',
    'SEO', 'Google Ads', 'Facebook Ads', 'Content Marketing', 'Email Marketing',
];

export const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Toronto', label: 'Eastern Time - Toronto' },
];

// -----------------------------------------------------------------------------
// Service Listings
// -----------------------------------------------------------------------------

export const mockServiceListings: ServiceListing[] = [
    {
        id: 'service-1',
        freelancerId: 'fp-1',
        title: 'I will build a modern React application with Next.js',
        category: 'Web Development',
        subcategory: 'Full Stack',
        tags: ['react', 'nextjs', 'typescript', 'tailwind'],
        description: 'I will create a responsive, high-performance web application using the latest React ecosystem technologies. Perfect for startups and businesses looking to scale.',
        packages: [
            { name: 'Basic', description: 'Single page landing app', price: 500, deliveryDays: 3, revisions: 2, features: ['Responsive Design', 'Source Code'] },
            { name: 'Standard', description: '5-page website with CMS', price: 1200, deliveryDays: 7, revisions: 5, features: ['Responsive Design', 'Source Code', 'Content Upload'] },
            { name: 'Premium', description: 'Full-stack application', price: 2500, deliveryDays: 14, revisions: -1, features: ['Admin Panel', 'Payment Integration', 'SEO Optimization'] }
        ],
        requirements: [],
        faqs: [],
        coverImage: '/services/react-dev.jpg',
        galleryImages: [],
        status: 'PUBLISHED',
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
    },
    {
        id: 'service-2',
        freelancerId: 'fp-2',
        title: 'I will design a professional brand identity and logo',
        category: 'Design',
        subcategory: 'Brand Identity',
        tags: ['logo', 'branding', 'identity', 'design'],
        description: 'Get a unique and memorable brand identity that stands out. Includes logo design, color palette, and brand guidelines.',
        packages: [
            { name: 'Basic', description: 'Logo Concept & Files', price: 300, deliveryDays: 2, revisions: 3, features: ['High Res', 'Transparent PNG'] },
            { name: 'Standard', description: 'Logo + Brand Guide', price: 600, deliveryDays: 5, revisions: 5, features: ['Vector Files', 'Social Media Kit'] },
            { name: 'Premium', description: 'Full Branding Suite', price: 1000, deliveryDays: 10, revisions: -1, features: ['Stationery Design', 'Copyright Transfer'] }
        ],
        requirements: [],
        faqs: [],
        coverImage: '/services/branding.jpg',
        galleryImages: [],
        status: 'PUBLISHED',
        createdAt: new Date('2025-01-16'),
        updatedAt: new Date('2025-01-16')
    },
    {
        id: 'service-3',
        freelancerId: 'fp-1',
        title: 'I will fix bugs and optimize your Node.js backend',
        category: 'Web Development',
        subcategory: 'Backend',
        tags: ['nodejs', 'express', 'optimization', 'bugfix'],
        description: 'Experiencing slow API responses or bugs? I will audit and optimize your Node.js code for maximum performance.',
        packages: [
            { name: 'Basic', description: 'Bug Fix & Audit', price: 150, deliveryDays: 1, revisions: 1, features: ['Code Review'] },
            { name: 'Standard', description: 'Performance Optimization', price: 400, deliveryDays: 3, revisions: 2, features: ['Load Testing', 'Refactoring'] },
            { name: 'Premium', description: 'Complete Backend Overhaul', price: 900, deliveryDays: 7, revisions: 3, features: ['Architecture Redesign'] }
        ],
        requirements: [],
        faqs: [],
        coverImage: '/services/backend.jpg',
        galleryImages: [],
        status: 'PUBLISHED',
        createdAt: new Date('2025-01-14'),
        updatedAt: new Date('2025-01-14')
    },
    {
        id: 'service-4',
        freelancerId: 'fp-2',
        title: 'I will create high-fidelity UI/UX prototypes in Figma',
        category: 'Design',
        subcategory: 'UI/UX',
        tags: ['figma', 'prototype', 'ui', 'ux'],
        description: 'Visualize your product before development. I create interactive high-fidelity prototypes that look and feel like the real app.',
        packages: [
            { name: 'Basic', description: '3-5 Screen Flow', price: 400, deliveryDays: 3, revisions: 2, features: ['Interactive', 'Source File'] },
            { name: 'Standard', description: '10-15 Screen Flow', price: 900, deliveryDays: 7, revisions: 4, features: ['User Journey Map', 'Design System'] },
            { name: 'Premium', description: 'Complete App Prototype', price: 1800, deliveryDays: 14, revisions: -1, features: ['Usability Testing Video'] }
        ],
        requirements: [],
        faqs: [],
        coverImage: '/services/uiux.jpg',
        galleryImages: [],
        status: 'PUBLISHED',
        createdAt: new Date('2025-01-13'),
        updatedAt: new Date('2025-01-13')
    },
    {
        id: 'service-5',
        freelancerId: 'fp-1',
        title: 'I will develop a custom e-commerce store with Stripe',
        category: 'Web Development',
        subcategory: 'E-Commerce',
        tags: ['ecommerce', 'stripe', 'shop'],
        description: 'Launch your online business with a custom-built e-commerce store. Secure payments, inventory management, and beautiful design.',
        packages: [
            { name: 'Basic', description: 'Store Setup', price: 800, deliveryDays: 5, revisions: 3, features: ['Product Upload', 'Payment Setup'] },
            { name: 'Standard', description: 'Custom Theme Dev', price: 1500, deliveryDays: 10, revisions: 5, features: ['Custom Design', 'Speed Optimization'] },
            { name: 'Premium', description: 'Full Custom Platform', price: 3500, deliveryDays: 21, revisions: -1, features: ['Advanced Analytics', 'Subscription Support'] }
        ],
        requirements: [],
        faqs: [],
        coverImage: '/services/ecommerce.jpg',
        galleryImages: [],
        status: 'PUBLISHED',
        createdAt: new Date('2025-01-12'),
        updatedAt: new Date('2025-01-12')
    },
];


export const countries = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IN', name: 'India' },
    { code: 'SG', name: 'Singapore' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'NL', name: 'Netherlands' },
];
