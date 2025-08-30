import { Client } from '@microsoft/microsoft-graph-client';
import type { AuthProviderCallback } from '@microsoft/microsoft-graph-client';
import { tokenManager } from './token-manager.js';
import { NOTEBOOK_CONFIG } from './notebook-config.js';
import { writable } from 'svelte/store';

// Create Svelte stores for the notebook data
export const notebookPages = writable([]);
export const notebookError = writable<string | null>(null);
export const isLoading = writable(true);

// Initialize the Graph client
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

export class DndNotebookService {
    private static instance: DndNotebookService;
    private refreshTimer: NodeJS.Timeout | null = null;

    private constructor() {
        // Start the auto-refresh when the service is created
        this.startAutoRefresh();
    }

    public static getInstance(): DndNotebookService {
        if (!DndNotebookService.instance) {
            DndNotebookService.instance = new DndNotebookService();
        }
        return DndNotebookService.instance;
    }

    private startAutoRefresh(): void {
        // Clear any existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Set up automatic refresh
        this.refreshTimer = setInterval(() => {
            this.refreshPages();
        }, NOTEBOOK_CONFIG.refreshInterval);

        // Initial load
        this.refreshPages();
    }

    private async refreshPages(): Promise<void> {
        try {
            isLoading.set(true);
            notebookError.set(null);

            const pages = await this.getPages();
            notebookPages.set(pages);
        } catch (error) {
            console.error('Error refreshing pages:', error);
            if (error instanceof Error) {
                notebookError.set(error.message);
            } else {
                notebookError.set('An unknown error occurred while loading the notebook');
            }
        } finally {
            isLoading.set(false);
        }
    }

    public async getPages() {
        try {
            // Direct API call to the specific notebook's pages
            const response = await client
                .api(`/me/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/pages`)
                .select('id,title,createdDateTime,lastModifiedDateTime,content')
                .orderby('lastModifiedDateTime desc')
                .count(true) // Include total count
                .top(50) // Limit to 50 most recent pages for better performance
                .get();
            return response.value;
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw error;
        }
    }

    public async getPageContent(pageId: string): Promise<string> {
        try {
            // Direct API call to get the specific page content from your notebook
            const response = await client
                .api(`/me/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/pages/${pageId}/content`)
                .header('Accept', 'text/html') // Explicitly request HTML content
                .get();
            return response;
        } catch (error) {
            console.error('Error fetching page content:', error);
            throw error;
        }
    }

    // Call this when the component is destroyed
    public cleanup(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

export const dndNotebookService = DndNotebookService.getInstance();
