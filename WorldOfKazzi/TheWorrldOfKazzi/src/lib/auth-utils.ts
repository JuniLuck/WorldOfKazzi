// Simple certificate-based authentication for SvelteKit API routes
import { createSign } from 'crypto';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

// Load environment variables
config();

const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const TENANT_ID = process.env.AZURE_TENANT_ID || '';
const CERTIFICATE_PATH = process.env.AZURE_CERTIFICATE_PATH || '';
const CERTIFICATE_THUMBPRINT = process.env.AZURE_CERTIFICATE_THUMBPRINT || '';

// Base64URL encoding helper
function base64UrlEncode(data: string): string {
    return Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAppToken(): Promise<string> {
    // Return cached token if still valid
    if (cachedToken && Date.now() < tokenExpiry) {
        console.log('Using cached token');
        return cachedToken;
    }

    try {
        console.log('Creating new JWT token...');
        console.log('CLIENT_ID:', CLIENT_ID ? 'Set' : 'Missing');
        console.log('TENANT_ID:', TENANT_ID ? 'Set' : 'Missing');
        console.log('CERTIFICATE_PATH:', CERTIFICATE_PATH);
        console.log('CERTIFICATE_THUMBPRINT:', CERTIFICATE_THUMBPRINT);

        // Convert hex thumbprint to base64url for x5t header
        const thumbprintBuffer = Buffer.from(CERTIFICATE_THUMBPRINT, 'hex');
        const x5tValue = thumbprintBuffer.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
        
        console.log('x5t value for JWT header:', x5tValue);

        // Create JWT
        const now = Math.floor(Date.now() / 1000);
        
        const header = {
            alg: 'RS256',
            typ: 'JWT',
            x5t: x5tValue
        };

        const payload = {
            aud: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
            iss: CLIENT_ID,
            sub: CLIENT_ID,
            jti: randomUUID(),
            nbf: now,
            exp: now + 600,
            iat: now
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        console.log('JWT Parts:');
        console.log('Header:', encodedHeader);
        console.log('Payload:', encodedPayload);
        console.log('Data to sign:', dataToSign);
        console.log('Data parts count:', dataToSign.split('.').length);

        // Read private key and sign
        const privateKey = readFileSync(CERTIFICATE_PATH, 'utf8');
        console.log('Private key loaded, length:', privateKey.length);
        
        const signature = createSign('RSA-SHA256')
            .update(dataToSign)
            .sign(privateKey);
        
        const encodedSignature = signature
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');

        const clientAssertion = `${dataToSign}.${encodedSignature}`;
        
        console.log('Final JWT:');
        console.log('Signature:', encodedSignature.substring(0, 20) + '...');
        console.log('Complete JWT parts count:', clientAssertion.split('.').length);
        console.log('JWT preview:', clientAssertion.substring(0, 50) + '...');

        if (clientAssertion.split('.').length !== 3) {
            throw new Error(`Invalid JWT format: expected 3 parts, got ${clientAssertion.split('.').length}`);
        }
        
        // Exchange JWT for access token
        const tokenResponse = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
                client_assertion: clientAssertion,
                scope: 'https://graph.microsoft.com/.default',
                grant_type: 'client_credentials'
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange failed:');
            console.error('Status:', tokenResponse.status);
            console.error('Response:', errorText);
            console.error('JWT that was sent:', clientAssertion.substring(0, 100) + '...');
            throw new Error(`Token request failed: ${tokenResponse.status} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful');
        cachedToken = tokenData.access_token;
        tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 300000; // 5 min buffer
        
        return cachedToken!;
    } catch (error) {
        console.error('Certificate auth error:', error);
        throw error;
    }
}
