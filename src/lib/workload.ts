import { db } from '@/lib/db';

export type WorkloadStatus = 'AVAILABLE' | 'LIMITED' | 'FULLY_BOOKED';

export interface WorkloadData {
    capacity: number;
    currentWorkload: number;
    utilization: number;
    status: WorkloadStatus;
    trialContracts: number;
    standardContracts: number;
    activeProjects: number;
}

/**
 * Compute freelancer workload from active contracts.
 * 
 * PURE READ-ONLY — no DB writes, no side effects.
 * Safe to call from any context (dashboard, profile, public profile).
 */
export async function getFreelancerWorkload(freelancerProfileId: string): Promise<WorkloadData> {
    // 1. Fetch freelancer profile for capacity
    const profile = await db.freelancerProfile.findUnique({
        where: { id: freelancerProfileId },
        select: { weeklyHours: true },
    });

    const capacity = profile?.weeklyHours ?? 40;

    // 2. Fetch ACTIVE contracts (ACTIVE, FUNDED, or DISPUTED — all consume bandwidth)
    const activeContracts = await db.contract.findMany({
        where: {
            freelancerId: freelancerProfileId,
            status: { in: ['ACTIVE', 'FUNDED', 'DISPUTED'] },
        },
        select: {
            id: true,
            type: true,
            // No estimatedHours field exists in schema, so we use type-based estimation
        },
    });

    // 3. Compute hours per contract using type-based fallback
    let totalHours = 0;
    let trialContracts = 0;
    let standardContracts = 0;

    for (const contract of activeContracts) {
        if (contract.type === 'TRIAL') {
            totalHours += 5;  // Trial contracts estimated at 5h/week
            trialContracts++;
        } else {
            totalHours += 15; // Standard contracts estimated at 15h/week
            standardContracts++;
        }
    }

    // 4. Compute utilization
    const utilization = capacity > 0 ? Math.round((totalHours / capacity) * 100) : 0;

    // 5. Determine status
    let status: WorkloadStatus;
    if (utilization >= 100) {
        status = 'FULLY_BOOKED';
    } else if (utilization >= 70) {
        status = 'LIMITED';
    } else {
        status = 'AVAILABLE';
    }

    return {
        capacity,
        currentWorkload: totalHours,
        utilization,
        status,
        trialContracts,
        standardContracts,
        activeProjects: activeContracts.length,
    };
}

/**
 * Convenience: get workload by userId instead of profileId.
 * Returns null if no freelancer profile exists.
 */
export async function getFreelancerWorkloadByUserId(userId: string): Promise<WorkloadData | null> {
    const profile = await db.freelancerProfile.findUnique({
        where: { userId },
        select: { id: true },
    });

    if (!profile) return null;

    return getFreelancerWorkload(profile.id);
}
