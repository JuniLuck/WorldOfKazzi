// API route to get page content
import { json } from '@sveltejs/kit';
import { getAppToken } from '$lib/auth-utils.js';
import { config } from 'dotenv';

// Load environment variables
config();

const ONENOTE_USER_ID = process.env.ONENOTE_USER_ID || '';

export const GET = async ({ params }) => {
    try {
        const pageId = params.pageId;
        if (!pageId) {
            return json({ error: 'Page ID is required' }, { status: 400 });
        }

        console.log('Getting content for page:', pageId);
        
        // Get app token using certificate
        const token = await getAppToken();
        
        // Call Graph API directly
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${ONENOTE_USER_ID}/onenote/pages/${pageId}/content`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Graph API error:', response.status, errorText);
            throw new Error(`Graph API error: ${response.status}`);
        }

        const content = await response.text(); // Page content is HTML, not JSON
        return json({ content });
    } catch (error) {
        console.error('API Error getting page content:', error);
        return json({ error: 'Failed to fetch page content' }, { status: 500 });
    }
};
