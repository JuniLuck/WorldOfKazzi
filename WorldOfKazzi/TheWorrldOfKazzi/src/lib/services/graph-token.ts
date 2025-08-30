import { tokenManager } from './token-manager.js';

let tokenUpdateInProgress = false;
let tokenUpdatePromise: Promise<string> | null = null;

async function showTokenUpdatePrompt(): Promise<string> {
    // This would be replaced with your preferred UI for token updates
    const newToken = prompt(
        'Your access token has expired. Please get a new token from the Microsoft Graph Explorer ' +
        '(https://developer.microsoft.com/en-us/graph/graph-explorer) and paste it here:'
    );
    
    if (!newToken) {
        throw new Error('No token provided');
    }
    
    return newToken;
}

export async function initializeTokenRefresh() {
    tokenManager.setRefreshCallback(async () => {
        // Only show one token update prompt at a time
        if (tokenUpdateInProgress && tokenUpdatePromise) {
            return tokenUpdatePromise;
        }

        tokenUpdateInProgress = true;
        try {
            tokenUpdatePromise = showTokenUpdatePrompt().then(newToken => {
                // Update the token in local storage
                localStorage.setItem('graphToken', newToken);
                return newToken;
            });
            return await tokenUpdatePromise;
        } finally {
            tokenUpdateInProgress = false;
            tokenUpdatePromise = null;
        }
    });

    // Try to load an existing token from storage
    const savedToken = localStorage.getItem('graphToken');
    if (savedToken) {
        // Update the token manager with the saved token
        const token = await tokenManager.getValidToken();
        localStorage.setItem('graphToken', token);
    }
}
