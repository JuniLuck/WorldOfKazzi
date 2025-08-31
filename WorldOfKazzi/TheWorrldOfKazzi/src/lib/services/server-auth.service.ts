// Server-side authentication service for app-only access
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientCredentialRequest } from '@azure/msal-node';

// These would come from environment variables
const CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const TENANT_ID = process.env.AZURE_TENANT_ID || '';

export class ServerAuthService {
    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    async getApplicationToken(): Promise<string> {
        // Check if we have a valid token
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Get app-only token using client credentials flow
            const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
            
            const params = new URLSearchParams();
            params.append('client_id', CLIENT_ID);
            params.append('client_secret', CLIENT_SECRET);
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
                throw new Error(`Token request failed: ${response.status}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            
            // Set expiry time (subtract 5 minutes for safety)
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 300000;
            
            return this.accessToken;
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
