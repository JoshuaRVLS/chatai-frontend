import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/settings/',
                '/chat/',
                '/my_characters/',
                '/my_personas/',
                '/create_character/',
                '/edit_character/',
                '/lorebooks/',
                '/create_lorebook/',
                '/verify-email/',
            ],
        },
        sitemap: 'https://jchatai.space/sitemap.xml',
    }
}
