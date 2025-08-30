const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: 'https://login.microsoftonline.com/common',
        clientSecret: import.meta.env.VITE_AZURE_CLIENT_SECRET,
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
    }
};

export const loginRequest = {
    scopes: ['User.Read', 'Notes.Read', 'Notes.Read.All']
};

export { msalConfig as authConfig };
