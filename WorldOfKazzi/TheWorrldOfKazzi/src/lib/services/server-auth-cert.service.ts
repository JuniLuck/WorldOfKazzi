// Server-side authentication service for app-only access with certificate
import { Client } from '@microsoft/microsoft-graph-client';
import { readFileSync } from 'fs';
import { createSign } from 'crypto';
import { randomUUID } from 'crypto';

// These would come from environment variables
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const TENANT_ID = process.env.AZURE_TENANT_ID || '';
const CERTIFICATE_PATH = process.env.AZURE_CERTIFICATE_PATH || '';
const CERTIFICATE_THUMBPRINT = process.env.AZURE_CERTIFICATE_THUMBPRINT || '';

// Base64URL encoding helper
function base64UrlEncode(str: string): string {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export class ServerAuthService {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    private createJWT(): string {
        const now = Math.floor(Date.now() / 1000);
        
        const header = {
            alg: 'RS256',
            typ: 'JWT',
            x5t: CERTIFICATE_THUMBPRINT
        };

        const payload = {
            aud: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
            iss: CLIENT_ID,
            sub: CLIENT_ID,
            jti: randomUUID(),
            nbf: now,
            exp: now + 600, // 10 minutes
            iat: now
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));
        
        const data = `${encodedHeader}.${encodedPayload}`;
        
        try {
            // Read the private key
            const privateKey = readFileSync(CERTIFICATE_PATH, 'utf8');
            
            // Sign the JWT
            const signature = createSign('RSA-SHA256')
                .update(data)
                .sign(privateKey);
            
            const encodedSignature = signature
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
            
            const jwt = `${data}.${encodedSignature}`;
            console.log('Created JWT with format:', jwt.split('.').length === 3 ? 'Valid (3 parts)' : 'Invalid');
            return jwt;
        } catch (error) {
            console.error('Error creating JWT:', error);
            throw new Error(`Failed to create JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async getApplicationToken(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Create client assertion JWT
            const clientAssertion = this.createJWT();
            
            // Get app-only token using certificate credentials
            const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
            
            const params = new URLSearchParams();
            params.append('client_id', CLIENT_ID);
            params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
            params.append('client_assertion', clientAssertion);
            params.append('scope', 'https://graph.microsoft.com/.default');
            params.append('grant_type', 'client_credentials');

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token request failed: ${response.status} - ${errorText}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            
            // Set expiry time (subtract 5 minutes for safety)
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 300000;
            
            return this.accessToken!;
        } catch (error) {
            console.error('Error getting application token:', error);
            throw new Error('Failed to get application access token');
        }
    }

    async getGraphClient(): Promise<Client> {
        const token = await this.getApplicationToken();
        
        return Client.init({
            authProvider: (callback) => {
                callback(null, token);
            }
        });
    }
}

export const serverAuthService = new ServerAuthService();
