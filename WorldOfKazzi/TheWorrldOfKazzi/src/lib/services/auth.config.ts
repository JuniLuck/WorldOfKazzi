const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        clientSecret: import.meta.env.VITE_AZURE_CLIENT_SECRET,
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'https://192.168.178.42:5173',
        navigateToLoginRequestUrl: true
    },
    cache: {
        cacheLocation: 'localStorage', // Changed from sessionStorage to persist across sessions
        storeAuthStateInCookie: true   // Enable cookies for better IE support and reliability
    },
    system: {
        allowRedirectInIframe: true,
        windowHashTimeout: 9000,
        iframeHashTimeout: 9000,
        loadFrameTimeout: 9000
    }
};

export const loginRequest = {
    scopes: [
        'User.Read',
        'Notes.Read',
        'Notes.Read.All',
        'Notes.ReadWrite',
        'Notes.ReadWrite.All',
        'offline_access'  // Important for refresh tokens
    ],
    prompt: 'select_account'
};

export { msalConfig as authConfig };
