// Debug authentication endpoint to see detailed error messages
import { json } from '@sveltejs/kit';
import { getAppToken } from '$lib/auth-utils.js';
import { config } from 'dotenv';

// Load environment variables
config();

export const GET = async () => {
    try {
        console.log('=== Debug Authentication Test ===');
        
        // Check environment variables
        const clientId = process.env.AZURE_CLIENT_ID;
        const tenantId = process.env.AZURE_TENANT_ID;
        const certPath = process.env.AZURE_CERTIFICATE_PATH;
        const certThumbprint = process.env.AZURE_CERTIFICATE_THUMBPRINT;
        const userId = process.env.ONENOTE_USER_ID;
        
        console.log('Environment check:');
        console.log('- CLIENT_ID:', clientId ? 'SET' : 'MISSING');
        console.log('- TENANT_ID:', tenantId ? 'SET' : 'MISSING');
        console.log('- CERTIFICATE_PATH:', certPath);
        console.log('- CERTIFICATE_THUMBPRINT:', certThumbprint ? 'SET' : 'MISSING');
        console.log('- USER_ID:', userId ? 'SET' : 'MISSING');
        
        // Try to get app token
        console.log('\n=== Attempting to get app token ===');
        const token = await getAppToken();
        console.log('✓ App token obtained successfully');
        console.log('Token length:', token.length);
        
        // Try to make a simple Graph API call
        console.log('\n=== Testing Graph API call ===');
        const response = await fetch(
            `https://graph.microsoft.com/v1.0/users/${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Graph API response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Graph API error response:', errorText);
            
            return json({
                success: false,
                error: 'Graph API error',
                status: response.status,
                details: errorText,
                environment: {
                    CLIENT_ID: clientId ? 'SET' : 'MISSING',
                    TENANT_ID: tenantId ? 'SET' : 'MISSING',
                    CERTIFICATE_PATH: certPath,
                    CERTIFICATE_THUMBPRINT: certThumbprint ? 'SET' : 'MISSING',
                    USER_ID: userId ? 'SET' : 'MISSING'
                }
            }, { status: 500 });
        }
        
        const userData = await response.json();
        console.log('✓ Graph API call successful');
        console.log('User display name:', userData.displayName);
        
        return json({
            success: true,
            message: 'Authentication working correctly',
            user: {
                displayName: userData.displayName,
                id: userData.id
            },
            environment: {
                CLIENT_ID: clientId ? 'SET' : 'MISSING',
                TENANT_ID: tenantId ? 'SET' : 'MISSING',
                CERTIFICATE_PATH: certPath,
                CERTIFICATE_THUMBPRINT: certThumbprint ? 'SET' : 'MISSING',
                USER_ID: userId ? 'SET' : 'MISSING'
            }
        });
        
    } catch (error) {
        console.error('=== Authentication Error ===');
        const err = error as Error;
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Stack trace:', err.stack);
        
        return json({
            success: false,
            error: err.message,
            errorType: err.constructor.name,
            stack: err.stack
        }, { status: 500 });
    }
};
