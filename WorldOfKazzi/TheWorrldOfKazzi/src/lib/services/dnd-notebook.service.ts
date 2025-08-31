import { Client } from '@microsoft/microsoft-graph-client';
import type { AuthProviderCallback } from '@microsoft/microsoft-graph-client';
import { tokenManager } from './token-manager.js';
import { NOTEBOOK_CONFIG } from './notebook-config.js';
import { writable } from 'svelte/store';

// Create Svelte stores for the notebook data
export const notebookPages = writable([]);
export const notebookError = writable<string | null>(null);
export const isLoading = writable(true);

// Graph client will be initialized when needed
let client: Client | null = null;

export class DndNotebookService {
    private static instance: DndNotebookService;
    private refreshTimer: NodeJS.Timeout | null = null;

    private constructor() {
        console.log('DND Notebook Service: Created');
    }

    public static getInstance(): DndNotebookService {
        if (!DndNotebookService.instance) {
            DndNotebookService.instance = new DndNotebookService();
        }
        return DndNotebookService.instance;
    }

    public async initialize() {
        if (!client) {
            client = Client.init({
                authProvider: async (done: AuthProviderCallback) => {
                    try {
                        const token = await tokenManager.getValidToken();
                        done(null, token);
                    } catch (error) {
                        done(error as Error, null);
                    }
                }
            });
        }
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

    public async refreshPages(): Promise<void> {
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
            if (!client) {
                throw new Error('Graph client not initialized. Call initialize() first.');
            }

            // First, get the sections of the notebook
            const sectionsResponse = await client
                .api(`/me/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/sections`)
                .get();

            if (!sectionsResponse.value || sectionsResponse.value.length === 0) {
                throw new Error('No sections found in the notebook');
            }

            // Use the first section (or you could specify which section you want)
            const sectionId = sectionsResponse.value[0].id;

            // Now get the pages from that section
            const response = await client
                .api(`/me/onenote/sections/${sectionId}/pages`)
                .select('id,title,createdDateTime,lastModifiedDateTime')
                .orderby('lastModifiedDateTime desc')
                .count(true)
                .top(50)
                .get();

            return response.value;
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw error;
        }
    }

    public async getPageContent(pageId: string): Promise<string> {
        try {
            if (!client) {
                throw new Error('Graph client not initialized. Call initialize() first.');
            }

            // Direct API call to get the specific page content
            const response = await client
                .api(`/me/onenote/pages/${pageId}/content`)
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
