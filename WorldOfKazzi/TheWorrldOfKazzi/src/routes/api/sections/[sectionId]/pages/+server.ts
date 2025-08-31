// API route to get pages for a specific section
import { json } from '@sveltejs/kit';
import { getAppToken } from '$lib/auth-utils.js';
import { config } from 'dotenv';

// Load environment variables
config();

const ONENOTE_USER_ID = process.env.ONENOTE_USER_ID || '';

export const GET = async ({ params }) => {
    try {
        const sectionId = params.sectionId;
        if (!sectionId) {
            return json({ error: 'Section ID is required' }, { status: 400 });
        }

        console.log('Getting pages for section:', sectionId);
        
        // Get app token using certificate
        const token = await getAppToken();
        
        // Call Graph API directly
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${ONENOTE_USER_ID}/onenote/sections/${sectionId}/pages?$select=id,title,createdDateTime,contentUrl`,
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

        const data = await response.json();
        return json(data.value || []);
    } catch (error) {
        console.error('API Error getting pages:', error);
        return json({ error: 'Failed to fetch pages' }, { status: 500 });
    }
};
