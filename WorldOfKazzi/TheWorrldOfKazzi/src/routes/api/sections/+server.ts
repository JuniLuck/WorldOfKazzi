// API route to get notebook sections without authentication
import { json } from '@sveltejs/kit';
import { getAppToken } from '$lib/auth-utils.js';
import { NOTEBOOK_CONFIG } from '$lib/services/notebook-config.js';
import { config } from 'dotenv';

// Load environment variables
config();

const ONENOTE_USER_ID = process.env.ONENOTE_USER_ID || '';

export const GET = async () => {
    try {
        console.log('=== SECTIONS ENDPOINT DEBUG ===');
        console.log('Getting sections for user:', ONENOTE_USER_ID);
        console.log('Notebook ID:', NOTEBOOK_CONFIG?.notebookId);
        
        if (!ONENOTE_USER_ID) {
            console.error('ONENOTE_USER_ID is missing!');
            return json({ error: 'User ID not configured' }, { status: 500 });
        }
        
        if (!NOTEBOOK_CONFIG?.notebookId) {
            console.error('Notebook ID is missing!');
            return json({ error: 'Notebook ID not configured' }, { status: 500 });
        }
        
        console.log('Getting app token...');
        // Get app token using certificate
        const token = await getAppToken();
        console.log('Got app token, length:', token.length);
        
        // Call Graph API directly
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${ONENOTE_USER_ID}/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/sections?$select=id,displayName,createdDateTime`,
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
        console.error('API Error getting sections:', error);
        return json({ error: 'Failed to fetch sections' }, { status: 500 });
    }
};
