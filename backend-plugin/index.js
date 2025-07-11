
import { google_web_search } from '@gemini-system/tool';

export const info = {
    id: 'google-search',
    name: 'Google 搜索',
    description: '一个通过 API 端点执行 Google 搜索的插件。',
};

export async function init(router) {
    console.log('Initializing Google Search plugin');
    router.get('/search', async (req, res) => {
        const { query } = req.query;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ error: 'Query parameter is missing or invalid.' });
        }

        try {
            console.log(`Performing Google search for: "${query}"`);
            const searchResults = await google_web_search({ query });
            console.log(`Found ${searchResults.length} results.`);
            return res.status(200).json(searchResults);
        } catch (error) {
            console.error('Error during Google search:', error);
            return res.status(500).json({ error: 'An error occurred while performing the search.' });
        }
    });
}
