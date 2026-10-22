export interface ActorTool {
    name: string;
    title: string;
    description: string;
    memoryMbytes: number;
    timeoutSecs: number;
    /** Pinned Apify build number. */
    build: string;
}

export const ACTORS: ActorTool[] = [
    {
        name: 'sitemap-url-extractor',
        title: 'Sitemap URL Extractor',
        description: 'Find sitemap URLs for one or more websites and return one row per page URL.',
        memoryMbytes: 256,
        timeoutSecs: 300,
        build: '1.0.1',
    },
    {
        name: 'seo-audit-ai-search-readiness',
        title: 'SEO Audit and AI Search Readiness',
        description: 'Score pages, or a site sampled from its sitemap, for on-page SEO and AI-search readiness.',
        memoryMbytes: 256,
        timeoutSecs: 300,
        build: '1.0.1',
    },
    {
        name: 'google-trends-batch-scraper',
        title: 'Google Trends Scraper',
        description: 'Fetch interest over time, regions, and related queries for a list of keywords.',
        memoryMbytes: 256,
        timeoutSecs: 600,
        build: '1.0.2',
    },
    {
        name: 'website-screenshot-batch',
        title: 'Website Screenshot Batch',
        description: 'Capture public URLs as PNG, JPEG, or PDF. Files are linked from the dataset, not inlined.',
        memoryMbytes: 2048,
        timeoutSecs: 900,
        build: '1.0.1',
    },
    {
        name: 'app-reviews-ios-android',
        title: 'App Reviews for iOS and Android',
        description: 'Collect recent public App Store and Play reviews. Reviewer names and avatars are not returned.',
        memoryMbytes: 256,
        timeoutSecs: 600,
        build: '1.0.1',
    },
    {
        name: 'url-pdf-to-markdown',
        title: 'URL and PDF to Markdown',
        description: 'Convert public web pages and PDF links into Markdown for LLM or RAG ingestion.',
        memoryMbytes: 512,
        timeoutSecs: 600,
        build: '1.0.2',
    },
];

export const ZERO_INSTALL_ACTORS = ACTORS.map((actor) => `appreciative_duct/${actor.name}`);
