import { type AccountInfo, type AuthenticationResult } from '@azure/msal-browser';
import { browser } from '$app/environment';
import { tokenManager } from './token-manager.js';
import { AuthService } from './auth.service.js';
import { loginRequest } from './auth.config.js';

class AzureAuthService {
    private authService: AuthService;
    private account: AccountInfo | null = null;

    constructor() {
        this.authService = AuthService.getInstance();
    }

    public async initialize(): Promise<void> {
        if (!browser) return;

        try {
            await this.authService.initialize();
            await this.initializeTokenRefresh();
        } catch (error) {
            console.error('Failed to initialize Azure Auth:', error);
            throw error;
        }
    }

    private async initializeTokenRefresh() {
        if (!browser) return;

        try {
            console.log('Initializing token refresh...');
            const accounts = this.authService.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                console.log('Found existing account');
                this.account = accounts[0];
            }

            tokenManager.setRefreshCallback(async () => {
                try {
                    if (!this.account) {
                        console.log('No account found, attempting to get stored account...');
                        const accounts = this.authService.msalInstance.getAllAccounts();
                        if (accounts.length > 0) {
                            this.account = accounts[0];
                            console.log('Found stored account:', this.account.username);
                        } else {
                            console.log('No stored account, initiating login...');
                            const loginResult = await this.login();
                            if (!loginResult?.account) {
                                throw new Error('Login failed to return an account');
                            }
                            this.account = loginResult.account;
                        }
                    }

                    console.log('Attempting to acquire token silently...');
                    try {
                        const result = await this.authService.msalInstance.acquireTokenSilent({
                            ...loginRequest,
                            account: this.account,
                            forceRefresh: true // Force a refresh to get a new token
                        });

                        if (!result?.accessToken) {
                            throw new Error('Failed to acquire token: No token returned');
                        }

                        console.log('Successfully acquired new token');
                        return result.accessToken;
                    } catch (silentError: any) {
                        // If silent token acquisition fails, try interactive
                        if (silentError.name === 'InteractionRequiredAuthError') {
                            console.log('Silent token acquisition failed, trying popup...');
                            const result = await this.authService.msalInstance.acquireTokenPopup({
                                ...loginRequest,
                                account: this.account
                            });
                            
                            if (!result?.accessToken) {
                                throw new Error('Failed to acquire token via popup');
                            }
                            
                            return result.accessToken;
                        }
                        throw silentError;
                    }
                } catch (error) {
                    console.error('Token refresh callback failed:', error);
                    throw error;
                }
            });

            if (this.account) {
                try {
                    const result = await this.authService.msalInstance.acquireTokenSilent({
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
        } catch (error) {
            console.error('Token refresh initialization failed:', error);
            throw error;
        }
    }

    public getMsalInstance() {
        return this.authService.msalInstance;
    }

    public getAccounts() {
        return this.authService.msalInstance.getAllAccounts();
    }

    public async acquireTokenForGraph(): Promise<string> {
        const accounts = this.getAccounts();
        if (accounts.length === 0) {
            throw new Error('No authenticated accounts found');
        }

        const account = accounts[0];
        try {
            const tokenResponse = await this.authService.msalInstance.acquireTokenSilent({
                scopes: ['Notes.Read', 'Notes.Read.All'],
                account: account
            });
            
            return tokenResponse.accessToken;
        } catch (error) {
            console.error('Failed to acquire Graph token:', error);
            throw error;
        }
    }

    public async login(): Promise<AuthenticationResult> {
        try {
            console.log('Starting login with scopes:', loginRequest.scopes);
            const response = await this.authService.msalInstance.loginPopup(loginRequest);
            console.log('Login response:', response);
            this.account = response.account;
            
            // Try to get a token right away to validate access
            const token = await this.authService.msalInstance.acquireTokenSilent({
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
        if (!this.account) return;

        try {
            await this.authService.msalInstance.logoutPopup({
                account: this.account
            });
            this.account = null;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
}

export const azureAuthService = new AzureAuthService();
