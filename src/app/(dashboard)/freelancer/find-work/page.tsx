import React from 'react';
import { db } from '@/lib/db';
import FindWorkClientView from './find-work-client-view';

export const dynamic = 'force-dynamic';

export default async function FindWorkPage() {
    // strict read-only query
    const jobs = await db.jobPost.findMany({
        where: {
            status: 'OPEN',
            visibility: 'PUBLIC',
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            id: true,
            title: true,
            overview: true,
            createdAt: true,
            budgetType: true,
            budgetMin: true,
            budgetMax: true,
            experienceLevel: true,
            duration: true,
            projectType: true,
            isRemote: true,
            client: {
                select: {
                    companyName: true,
                    user: {
                        select: {
                            name: true,
                            isVerified: true
                        }
                    }
                }
            },
            skills: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        take: 50
    });

    return <FindWorkClientView jobs={jobs} />;
}
