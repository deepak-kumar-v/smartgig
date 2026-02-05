import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/dashboard/', '/admin/', '/settings/', '/api/'],
        },
        sitemap: 'https://smartgig.com/sitemap.xml',
    }
}
