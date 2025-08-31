// Test script to validate JWT creation and certificate authentication
import { serverAuthService } from './src/lib/services/server-auth-cert.service.js';

async function testCertificateAuth() {
    console.log('=== Testing Certificate Authentication ===\n');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('CLIENT_ID:', process.env.AZURE_CLIENT_ID ? 'Set' : 'Missing');
    console.log('TENANT_ID:', process.env.AZURE_TENANT_ID ? 'Set' : 'Missing');
    console.log('CERTIFICATE_PATH:', process.env.AZURE_CERTIFICATE_PATH ? 'Set' : 'Missing');
    console.log('CERTIFICATE_THUMBPRINT:', process.env.AZURE_CERTIFICATE_THUMBPRINT ? 'Set' : 'Missing');
    console.log('USER_ID:', process.env.ONENOTE_USER_ID ? 'Set' : 'Missing');
    console.log('');
    
    // Check certificate file exists
    try {
        const fs = await import('fs');
        const certPath = process.env.AZURE_CERTIFICATE_PATH || '';
        if (fs.existsSync(certPath)) {
            console.log('✅ Certificate file exists:', certPath);
        } else {
            console.log('❌ Certificate file missing:', certPath);
            return;
        }
    } catch (error) {
        console.log('❌ Error checking certificate file:', error);
        return;
    }
    
    // Test token acquisition
    try {
        console.log('🔄 Testing token acquisition...');
        const token = await serverAuthService.getApplicationToken();
        
        // Validate JWT format
        const parts = token.split('.');
        console.log('✅ JWT Parts Count:', parts.length);
        
        if (parts.length === 3) {
            console.log('✅ JWT Format: Valid');
            console.log('Header length:', parts[0].length);
            console.log('Payload length:', parts[1].length);
            console.log('Signature length:', parts[2].length);
        } else {
            console.log('❌ JWT Format: Invalid - should have 3 parts separated by dots');
        }
        
        console.log('Token preview:', token.substring(0, 50) + '...');
        
    } catch (error) {
        console.log('❌ Token acquisition failed:', error);
    }
    
    // Test Graph client creation
    try {
        console.log('🔄 Testing Graph client creation...');
        const client = await serverAuthService.getGraphClient();
        console.log('✅ Graph client created successfully');
        
        // Test a simple Graph API call
        console.log('🔄 Testing Graph API call...');
        const response = await client.api('/me').get();
        console.log('✅ Graph API call successful');
        console.log('User:', response.displayName);
        
    } catch (error) {
        console.log('❌ Graph client/API test failed:', error);
    }
}

testCertificateAuth().catch(console.error);
