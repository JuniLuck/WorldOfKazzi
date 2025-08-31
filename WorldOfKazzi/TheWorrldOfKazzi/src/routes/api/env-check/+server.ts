// Simple test to check environment variables and certificate
import { json } from '@sveltejs/kit';
import { config } from 'dotenv';

// Load environment variables
config();

export const GET = async () => {
    try {
        const envCheck = {
            CLIENT_ID: process.env.AZURE_CLIENT_ID || 'MISSING',
            TENANT_ID: process.env.AZURE_TENANT_ID || 'MISSING', 
            CERTIFICATE_PATH: process.env.AZURE_CERTIFICATE_PATH || 'MISSING',
            CERTIFICATE_THUMBPRINT: process.env.AZURE_CERTIFICATE_THUMBPRINT || 'MISSING',
            USER_ID: process.env.ONENOTE_USER_ID || 'MISSING',
            NODE_ENV: process.env.NODE_ENV || 'MISSING'
        };

        // Check if certificate file exists
        let certExists = false;
        try {
            const fs = await import('fs');
            const path = process.env.AZURE_CERTIFICATE_PATH || './certificates/app-cert-private.pem';
            certExists = fs.existsSync(path);
        } catch (e) {
            // File system error
        }

        return json({
            success: true,
            environment: envCheck,
            certificateExists: certExists,
            message: 'Environment check complete'
        });

    } catch (error) {
        return json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
