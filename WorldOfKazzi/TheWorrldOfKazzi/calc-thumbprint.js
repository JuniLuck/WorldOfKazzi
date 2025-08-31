// Calculate proper certificate thumbprint for Azure AD
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

try {
    // Read the certificate file
    const certPath = './certificates/app-cert.crt';
    console.log('Reading certificate from:', certPath);
    
    const certData = readFileSync(certPath, 'utf8');
    console.log('Certificate loaded successfully');
    
    // Extract the base64 content (remove headers and newlines)
    const base64Cert = certData
        .replace(/-----BEGIN CERTIFICATE-----/, '')
        .replace(/-----END CERTIFICATE-----/, '')
        .replace(/\r?\n/g, '');
    
    console.log('Base64 cert length:', base64Cert.length);
    
    // Convert to buffer
    const certBuffer = Buffer.from(base64Cert, 'base64');
    console.log('Certificate buffer length:', certBuffer.length);
    
    // Calculate SHA-1 hash
    const sha1Hash = createHash('sha1').update(certBuffer).digest();
    
    // Convert to hex (uppercase)
    const thumbprintHex = sha1Hash.toString('hex').toUpperCase();
    console.log('Thumbprint (hex):', thumbprintHex);
    
    // Convert to base64 (for x5t header)
    const thumbprintBase64 = sha1Hash.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    console.log('Thumbprint (base64url for x5t):', thumbprintBase64);
    
    // This should match what Azure expects
    console.log('\n=== Results ===');
    console.log('For .env file (AZURE_CERTIFICATE_THUMBPRINT):', thumbprintHex);
    console.log('For JWT x5t header:', thumbprintBase64);
    
} catch (error) {
    console.error('Error:', error);
}
