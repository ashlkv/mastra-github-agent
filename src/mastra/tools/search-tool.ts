import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const searchTool = createTool({
    id: 'web-search',
    description: 'Search the web for candidate information across professional platforms',
    inputSchema: z.object({
        query: z.string().describe('Search query or keywords'),
        base_url: z.string().url().optional().describe('Optional custom base URL for search (defaults to Google)'),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        data: z.object({
            results: z.array(z.object({
                title: z.string(),
                url: z.string(),
                snippet: z.string(),
                platform: z.string(),
                relevance: z.number(),
            })),
            total_matches: z.number(),
            query: z.string(),
        }).optional(),
        message: z.string().optional(),
    }),
    execute: async ({ context }) => {
        const { query, base_url } = context;

        try {
            // Use the query directly
            const searchQuery = query;

            // Define search platforms and their URLs
            const searchPlatforms = [];

            if (base_url) {
                // Use custom base URL
                const customUrl = `${base_url}${base_url.includes('?') ? '&' : '?'}q=${encodeURIComponent(searchQuery)}`;
                const domain = new URL(base_url).hostname;
                searchPlatforms.push({
                    platform: domain,
                    url: customUrl,
                    title: `${query} - ${domain}`,
                    snippet: `Search results for "${query}" on ${domain}`,
                });
            } else {
                // Default to Google search
                searchPlatforms.push({
                    platform: 'Google',
                    url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
                    title: `${query} - Google Search`,
                    snippet: `General web search results for "${query}"`,
                });
            }

            // Generate search results with relevance scoring
            const webResults = searchPlatforms.map((platform, index) => ({
                title: platform.title,
                url: platform.url,
                snippet: platform.snippet,
                platform: platform.platform,
                relevance: 1 - (index * 0.15), // Decreasing relevance score
            }));

            // In a real implementation, you would:
            // 1. Use actual web search APIs (Google Custom Search, Bing Search API, etc.)
            // 2. Parse and extract real content from search results
            // 3. Apply machine learning-based relevance scoring
            // 4. Filter results based on privacy and compliance requirements

            return {
                success: true,
                data: {
                    results: webResults,
                    total_matches: webResults.length,
                    query: searchQuery,
                },
                message: `Found ${webResults.length} web search results for "${searchQuery}"`,
            };
        } catch (exception: unknown) {
            return {
                success: false,
                data: undefined,
                message:
                    exception instanceof Error
                        ? `Web search error: ${exception.message}`
                        : `Web search error: ${String(exception)}`,
            };
        }
    },
});