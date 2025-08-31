// Test endpoint to debug certificate authentication
import { json } from '@sveltejs/kit';
import { getAppToken } from '$lib/auth-utils.js';
import { config } from 'dotenv';

// Load environment variables
config();

export const GET = async () => {
    try {
        console.log('=== Testing Certificate Authentication ===');
        
        // Log environment variables (without exposing secrets)
        console.log('Environment check:');
        console.log('- CLIENT_ID:', process.env.AZURE_CLIENT_ID ? 'Set' : 'Missing');
        console.log('- TENANT_ID:', process.env.AZURE_TENANT_ID ? 'Set' : 'Missing');
        console.log('- CERTIFICATE_PATH:', process.env.AZURE_CERTIFICATE_PATH ? 'Set' : 'Missing');
        console.log('- CERTIFICATE_THUMBPRINT:', process.env.AZURE_CERTIFICATE_THUMBPRINT ? 'Set' : 'Missing');
        console.log('- USER_ID:', process.env.ONENOTE_USER_ID ? 'Set' : 'Missing');
        
        // Test token acquisition
        console.log('Testing token acquisition...');
        const token = await getAppToken();
        
        console.log('Token acquired successfully');
        console.log('Token preview:', token.substring(0, 50) + '...');
        
        return json({ 
            success: true, 
            message: 'Certificate authentication working',
            tokenPreview: token.substring(0, 50) + '...'
        });
        
    } catch (error) {
        console.error('Certificate auth test failed:', error);
        return json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 });
    }
};
