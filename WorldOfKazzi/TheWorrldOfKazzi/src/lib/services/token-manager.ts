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

    private base64DecodeUrl(str: string): string {
        // Convert Base64URL to Base64 by replacing URL-safe chars and adding padding
        let output = str.replace(/-/g, '+').replace(/_/g, '/');
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw new Error('Invalid base64url string');
        }
        return output;
    }

    private parseAccessToken(token: string): any {
        try {
            if (!token) {
                throw new Error('Token is empty or undefined');
            }

            // Check if it's an Azure AD token (starts with 'EwB')
            if (token.startsWith('EwB')) {
                // For Azure AD tokens, we'll use a different approach
                // These tokens contain expiration time in a different format
                // We'll set a default expiration time of 1 hour from now
                return {
                    exp: Math.floor(Date.now() / 1000) + 3600,
                    isAzureToken: true
                };
            }

            // For standard JWT tokens
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Not an Azure AD token and not a valid JWT format');
            }

            const base64Url = parts[1];
            console.log('Attempting to parse token payload...');
            
            const base64 = this.base64DecodeUrl(base64Url);
            const rawPayload = atob(base64);
            
            // Convert binary string to UTF-8
            const payload = new Uint8Array(rawPayload.length);
            for (let i = 0; i < rawPayload.length; i++) {
                payload[i] = rawPayload.charCodeAt(i);
            }
            
            const decoder = new TextDecoder('utf-8');
            const decodedPayload = decoder.decode(payload);
            
            try {
                const jsonPayload = JSON.parse(decodedPayload);
                console.log('Token payload parsed successfully');
                return jsonPayload;
            } catch (parseError) {
                console.error('Failed to parse token JSON:', parseError);
                throw new Error('Invalid token format: payload is not valid JSON');
            }
        } catch (error) {
            console.error('Error parsing JWT:', error);
            if (error instanceof Error) {
                console.error('Token parsing error details:', error.message);
                // Log the first 10 characters of the token for debugging (avoid logging the full token)
                console.log('Token prefix:', token ? token.substring(0, 10) + '...' : 'null or undefined');
            }
            throw error;
        }
    }

    private setTokenExpiration() {
        if (this.currentToken) {
            try {
                // Token expiration is calculated from the parsed token
                const tokenPayload = this.parseAccessToken(this.currentToken);
                this.tokenExpirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
                if (!this.tokenExpirationTime) {
                    throw new Error('No expiration time in token');
                }
                
                // Log token type for debugging
                if (tokenPayload.isAzureToken) {
                    console.log('Successfully parsed Azure AD token');
                } else {
                    console.log('Successfully parsed JWT token');
                }
            } catch (error) {
                console.error('Error parsing token:', error);
                this.tokenExpirationTime = null;
                // If we can't parse the token, consider it expired
                if (browser) {
                    localStorage.removeItem('graphToken');
                }
                this.currentToken = null;
            }
        }
    }

    public setRefreshCallback(callback: () => Promise<string>) {
        this.refreshCallback = callback;
    }

    public async getValidToken(): Promise<string> {
        console.log('Getting valid token...');
        const now = Date.now();
        
        // Function to clear token data
        const clearTokenData = () => {
            this.currentToken = null;
            this.tokenExpirationTime = null;
            if (browser) {
                localStorage.removeItem('graphToken');
            }
        };

        // Check if we have a token and validate it
        if (this.currentToken) {
            try {
                console.log('Validating current token...');
                const tokenPayload = this.parseAccessToken(this.currentToken);
                const tokenExpiresSoon = tokenPayload.exp * 1000 - now < 300000; // 5 minutes buffer

                if (tokenPayload.exp * 1000 < now) {
                    console.log('Current token is expired');
                    clearTokenData();
                } else if (!tokenExpiresSoon) {
                    console.log('Current token is still valid');
                    return this.currentToken;
                } else {
                    console.log('Token expires soon, will attempt refresh');
                }
            } catch (error) {
                console.log('Current token validation failed:', error);
                clearTokenData();
            }
        }

        // At this point, we either have no token or need to refresh it
        if (!this.refreshCallback) {
            console.error('No refresh callback set');
            throw new Error('No refresh callback set and token is expired or missing');
        }

        let retryCount = 0;
        const maxRetries = 3;
        let lastError: Error | null = null;

        while (retryCount < maxRetries) {
            try {
                console.log(`Attempting to refresh token (attempt ${retryCount + 1}/${maxRetries})...`);
                const newToken = await this.refreshCallback();
                
                if (!newToken) {
                    throw new Error('No token received from refresh callback');
                }

                // Log token format for debugging (first few chars only)
                console.log('Received new token format check:', 
                    newToken.substring(0, 10) + '... ' +
                    `(length: ${newToken.length}, parts: ${newToken.split('.').length})`
                );

                // Validate the new token before storing
                const tokenPayload = this.parseAccessToken(newToken);
                
                if (!tokenPayload.exp) {
                    throw new Error('Invalid token: no expiration claim');
                }
                
                // Log token type for debugging
                if (tokenPayload.isAzureToken) {
                    console.log('Successfully validated Azure AD token');
                } else {
                    console.log('Successfully validated JWT token');
                }

                if (tokenPayload.exp * 1000 < now) {
                    throw new Error('Received already expired token');
                }

                this.currentToken = newToken;
                if (browser) {
                    localStorage.setItem('graphToken', newToken);
                }
                this.setTokenExpiration();
                console.log('Successfully refreshed and stored new token');
                return this.currentToken;

            } catch (error) {
                console.error(`Error refreshing token (attempt ${retryCount + 1}/${maxRetries}):`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                retryCount++;
                
                if (retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.log(`Waiting ${delay}ms before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        clearTokenData(); // Clear any invalid token data
        throw new Error(`Failed to refresh token after ${maxRetries} attempts. Last error: ${lastError?.message}`);
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
