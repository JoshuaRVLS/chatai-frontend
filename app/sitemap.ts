import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://jchatai.space'

    // Standard pages
    const routes = ['', '/explore', '/privacy', '/terms'].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    try {
        // Fetch public characters for sitemap
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/characters`)
        const { data } = await response.json()

        const characterRoutes = (data || []).map((char: any) => ({
            url: `${baseUrl}/character/${char.id}`,
            lastModified: new Date(char.updatedAt || new Date()),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }))

        return [...routes, ...characterRoutes]
    } catch (error) {
        console.error('Error generating character routes for sitemap:', error)
        return routes
    }
}
