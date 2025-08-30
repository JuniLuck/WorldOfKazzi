import type { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { browser } from '$app/environment';

export class TokenManager {
    private static instance: TokenManager;
    private currentToken: string | null = null;
    private tokenExpirationTime: number | null = null;
    private refreshCallback: (() => Promise<string>) | null = null;

    private constructor() {
        // Initialize with the current token from environment or storage
        const savedToken = browser ? localStorage.getItem('graphToken') : null;
        this.currentToken = savedToken || import.meta.env.VITE_ACCESS_TOKEN;
        this.setTokenExpiration();
    }

    public static getInstance(): TokenManager {
        if (!TokenManager.instance) {
            TokenManager.instance = new TokenManager();
        }
        return TokenManager.instance;
    }

    private setTokenExpiration() {
        if (this.currentToken) {
            try {
                // Token expiration is calculated from the JWT exp claim
                const tokenPayload = JSON.parse(atob(this.currentToken.split('.')[1]));
                this.tokenExpirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
            } catch (error) {
                console.error('Error parsing token:', error);
                this.tokenExpirationTime = null;
            }
        }
    }

    public setRefreshCallback(callback: () => Promise<string>) {
        this.refreshCallback = callback;
    }

    public async getValidToken(): Promise<string> {
        const now = Date.now();
        const tokenExpiresSoon = this.tokenExpirationTime && (this.tokenExpirationTime - now < 300000); // 5 minutes buffer

        if (!this.currentToken || tokenExpiresSoon) {
            if (this.refreshCallback) {
                try {
                    const newToken = await this.refreshCallback();
                    this.currentToken = newToken;
                    this.setTokenExpiration();
                } catch (error) {
                    console.error('Error refreshing token:', error);
                    throw new Error('Failed to refresh token');
                }
            } else {
                throw new Error('No refresh callback set and token is expired or missing');
            }
        }

        return this.currentToken;
    }

    public createAuthProvider() {
        return (callback: (error: Error | null, accessToken: string | null) => void) => {
            this.getValidToken()
                .then(token => callback(null, token))
                .catch(error => callback(error, null));
        };
    }
}

export const tokenManager = TokenManager.getInstance();
