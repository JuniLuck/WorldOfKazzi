// Simple test to check if certificate can be loaded
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config();

// Load environment variables
config();

console.log('=== Certificate Loading Test ===');

const CLIENT_ID = process.env.AZURE_CLIENT_ID;
const TENANT_ID = process.env.AZURE_TENANT_ID;  
const CERTIFICATE_PATH = process.env.AZURE_CERTIFICATE_PATH;
const CERTIFICATE_THUMBPRINT = process.env.AZURE_CERTIFICATE_THUMBPRINT;
const USER_ID = process.env.ONENOTE_USER_ID;

console.log('Environment Variables:');
console.log('CLIENT_ID:', CLIENT_ID ? 'SET' : 'MISSING');
console.log('TENANT_ID:', TENANT_ID ? 'SET' : 'MISSING');
console.log('CERTIFICATE_PATH:', CERTIFICATE_PATH);
console.log('CERTIFICATE_THUMBPRINT:', CERTIFICATE_THUMBPRINT ? 'SET' : 'MISSING');
console.log('USER_ID:', USER_ID ? 'SET' : 'MISSING');

console.log('\n=== Certificate File Test ===');
try {
    const certPath = CERTIFICATE_PATH || './certificates/app-cert-private.pem';
    const fullPath = join(process.cwd(), certPath);
    console.log('Trying to read certificate from:', fullPath);
    
    const privateKey = readFileSync(fullPath, 'utf8');
    console.log('✓ Certificate file loaded successfully');
    console.log('Certificate length:', privateKey.length, 'characters');
    console.log('Certificate starts with:', privateKey.substring(0, 50) + '...');
} catch (error) {
    console.error('✗ Error loading certificate:', error.message);
}
