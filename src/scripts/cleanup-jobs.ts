'use server';

import { db } from '@/lib/db';

/**
 * One-time cleanup script to delete all JobPost data.
 * Run via: npx tsx src/scripts/cleanup-jobs.ts
 * Or call directly from a route/action.
 */
export async function cleanupJobPosts() {
    console.log('[Cleanup] Starting JobPost data cleanup...');

    try {
        // Step 1: Delete all Proposals (depends on JobPost)
        const deletedProposals = await db.proposal.deleteMany({});
        console.log(`[Cleanup] Deleted ${deletedProposals.count} proposals`);

        // Step 2: Delete all JobPosts (will cascade skill relations)
        const deletedJobs = await db.jobPost.deleteMany({});
        console.log(`[Cleanup] Deleted ${deletedJobs.count} job posts`);

        console.log('[Cleanup] JobPost data cleanup complete!');
        return { success: true, deletedProposals: deletedProposals.count, deletedJobs: deletedJobs.count };
    } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
        return { error: 'Failed to cleanup job posts' };
    }
}

// Execute if run directly
if (require.main === module) {
    cleanupJobPosts().then(console.log).catch(console.error);
}
