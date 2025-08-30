import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import { browser } from '$app/environment';
import { tokenManager } from './token-manager.js';

const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: browser ? window.location.origin : 'http://localhost:5173',
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
    }
};

const loginRequest = {
    scopes: [
        'https://graph.microsoft.com/Notes.Read',
        'https://graph.microsoft.com/Notes.ReadWrite',
        'https://graph.microsoft.com/User.Read'
    ]
};

class AzureAuthService {
    private client: PublicClientApplication | null = null;
    private account: AccountInfo | null = null;

    constructor() {
        // Empty constructor
    }

    public async initialize(): Promise<void> {
        if (!browser || this.client) return;

        this.client = new PublicClientApplication(msalConfig);
        await this.initializeTokenRefresh();
    }

    private async initializeTokenRefresh() {
        if (!this.client || !browser) return;

        await this.client.initialize();
        const accounts = this.client.getAllAccounts();
        if (accounts.length > 0) {
            this.account = accounts[0];
        }

        tokenManager.setRefreshCallback(async () => {
            if (!this.client) throw new Error('MSAL client not initialized');

            try {
                if (!this.account) {
                    throw new Error('No account - login required');
                }

                const result = await this.client.acquireTokenSilent({
                    ...loginRequest,
                    account: this.account
                });

                if (!result?.accessToken) {
                    throw new Error('Failed to acquire token: No token returned');
                }

                return result.accessToken;
            } catch (error) {
                console.error('Token acquisition failed:', error);
                throw error;
            }
        });

        if (this.account) {
            try {
                const result = await this.client.acquireTokenSilent({
                    ...loginRequest,
                    account: this.account
                });
                if (result?.accessToken) {
                    await tokenManager.getValidToken();
                }
            } catch (error) {
                console.error('Failed to get initial token:', error);
            }
        }
    }

    public async login(): Promise<AuthenticationResult> {
        if (!this.client) throw new Error('MSAL client not initialized');

        try {
            console.log('Starting login with scopes:', loginRequest.scopes);
            const response = await this.client.loginPopup(loginRequest);
            console.log('Login response:', response);
            this.account = response.account;
            
            // Try to get a token right away to validate access
            const token = await this.client.acquireTokenSilent({
                ...loginRequest,
                account: response.account
            });
            
            console.log('Got initial token:', token ? 'yes' : 'no');
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    public async logout(): Promise<void> {
        if (!this.client || !this.account) return;

        await this.client.logoutPopup({
            account: this.account
        });
        this.account = null;
    }
}

export const azureAuthService = new AzureAuthService();
