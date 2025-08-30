import { Client } from '@microsoft/microsoft-graph-client';
import type { AuthProviderCallback } from '@microsoft/microsoft-graph-client';
import { tokenManager } from './token-manager.js';

const client = Client.init({
    authProvider: async (done: AuthProviderCallback) => {
        try {
            const token = await tokenManager.getValidToken();
            done(null, token);
        } catch (error) {
            done(error as Error, null);
        }
    }
});

export async function getNotebook(notebookId: string) {
    try {
        const response = await client
            .api(`/me/onenote/notebooks/${notebookId}`)
            .get();
        return response;
    } catch (error) {
        console.error('Error fetching notebook:', error);
        throw error;
    }
}

export async function getNotebookSections(notebookId: string) {
    try {
        const response = await client
            .api(`/me/onenote/notebooks/${notebookId}/sections`)
            .get();
        return response.value;
    } catch (error) {
        console.error('Error fetching sections:', error);
        throw error;
    }
}

export async function getNotebookPages(notebookId: string) {
    try {
        const response = await client
            .api(`/me/onenote/notebooks/${notebookId}/pages`)
            .get();
        return response.value;
    } catch (error) {
        console.error('Error fetching pages:', error);
        throw error;
    }
}

export async function getPageContent(pageId: string) {
    try {
        const response = await client
            .api(`/me/onenote/pages/${pageId}/content`)
            .get();
        return response;
    } catch (error) {
        console.error('Error fetching page content:', error);
        throw error;
    }
}
