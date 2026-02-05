import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    // NOTE: Category model not currently in schema
    // This script is deprecated for now
    console.log('Category model not in schema - skipping seed');

    /* 
    const categories = [
        { name: 'Web Development', slug: 'web-development' },
        { name: 'Mobile Apps', slug: 'mobile-apps' },
        { name: 'Design & Creative', slug: 'design-creative' },
        { name: 'Writing & Translation', slug: 'writing-translation' },
        { name: 'Digital Marketing', slug: 'digital-marketing' },
        { name: 'Video & Animation', slug: 'video-animation' },
        { name: 'Music & Audio', slug: 'music-audio' },
        { name: 'Data & AI', slug: 'data-ai' },
    ];

    for (const cat of categories) {
        const existing = await db.category.findUnique({
            where: { slug: cat.slug }
        });

        if (!existing) {
            await db.category.create({
                data: cat
            });
            console.log(`Created category: ${cat.name}`);
        } else {
            console.log(`Category exists: ${cat.name}`);
        }
    }
    */
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
