import { PublicClientApplication } from '@azure/msal-browser';
import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { authConfig, loginRequest } from './auth.config.js';

export class AuthService {
    public msalInstance: PublicClientApplication;
    private graphClient: Client | null = null;

    private static instance: AuthService | null = null;
    private initialized = false;

    private constructor() {
        this.msalInstance = new PublicClientApplication(authConfig);
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;
        
        try {
            await this.msalInstance.initialize();
            // Handle redirect promise after login
            await this.msalInstance.handleRedirectPromise();
            this.initialized = true;
            console.log('MSAL successfully initialized');
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
            throw error;
        }
    }

    private async getTokenSilent(account: AccountInfo): Promise<AuthenticationResult> {
        try {
            console.log('Attempting silent token acquisition...');
            const result = await this.msalInstance.acquireTokenSilent({
                ...loginRequest,
                account
            });
            console.log('Silent token acquisition successful');
            return result;
        } catch (error: any) {
            console.error('Silent token acquisition failed:', error);
            
            // Check if we need to do interactive login
            if (error.name === "InteractionRequiredAuthError") {
                console.log('Interaction required, attempting popup login...');
                try {
                    return await this.msalInstance.acquireTokenPopup({
                        ...loginRequest,
                        account
                    });
                } catch (popupError) {
                    console.error('Popup login failed:', popupError);
                    throw popupError;
                }
            }
            
            throw error;
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

export const authService = AuthService.getInstance();
