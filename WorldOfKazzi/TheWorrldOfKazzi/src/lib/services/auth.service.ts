import { PublicClientApplication } from '@azure/msal-browser';
import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { authConfig, loginRequest } from './auth.config';

class AuthService {
    public msalInstance: PublicClientApplication;
    private graphClient: Client | null = null;

    constructor() {
        this.msalInstance = new PublicClientApplication(authConfig);
    }

    async initialize(): Promise<void> {
        await this.msalInstance.initialize();
        // Handle redirect promise after login
        await this.msalInstance.handleRedirectPromise();
    }

    private async getTokenSilent(account: AccountInfo): Promise<AuthenticationResult> {
        try {
            return await this.msalInstance.acquireTokenSilent({
                ...loginRequest,
                account
            });
        } catch (error) {
            console.error('Silent token acquisition failed:', error);
            // If silent token acquisition fails, try interactive method
            return this.msalInstance.acquireTokenPopup(loginRequest);
        }
    }

    async login(): Promise<AuthenticationResult> {
        try {
            console.log('Starting login process...');
            const loginResponse = await this.msalInstance.loginPopup({
                ...loginRequest,
                extraQueryParameters: {
                    client_secret: import.meta.env.VITE_AZURE_CLIENT_SECRET
                }
            });
            console.log('Login successful:', loginResponse);

            if (loginResponse?.account) {
                const tokenResponse = await this.getTokenSilent(loginResponse.account);
                this.setGraphClient(tokenResponse);
                return tokenResponse;
            }
            throw new Error('Login failed - no account information');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        const account = this.msalInstance.getActiveAccount();
        if (account) {
            await this.msalInstance.logoutPopup({
                account
            });
        }
        this.graphClient = null;
    }

    private setGraphClient(authResponse: AuthenticationResult): void {
        this.graphClient = Client.init({
            authProvider: async (callback) => {
                try {
                    if (authResponse.account) {
                        const token = (await this.getTokenSilent(authResponse.account)).accessToken;
                        callback(null, token);
                    } else {
                        throw new Error('No account found');
                    }
                } catch (error) {
                    callback(error, null);
                }
            }
        });
    }

    getGraphClient(): Client {
        if (!this.graphClient) {
            throw new Error('Not authenticated - please log in first');
        }
        return this.graphClient;
    }
}

export const authService = new AuthService();
