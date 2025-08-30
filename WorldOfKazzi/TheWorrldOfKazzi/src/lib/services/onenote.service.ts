import type { Notebook, OnenoteSection, OnenotePage } from '@microsoft/microsoft-graph-types';
import { authService } from './auth.service.js';
import { authConfig } from './auth.config.js';

export class OneNoteService {
    async shareNotebook(notebookId: string): Promise<void> {
        try {
            console.log('Sharing notebook...');
            const client = authService.getGraphClient();
            
            // First, get the drive item ID for the notebook
            const notebook = await client
                .api(`/me/onenote/notebooks/${notebookId}`)
                .select('links')
                .get();
            
            if (!notebook.links?.oneNoteWebUrl) {
                throw new Error('Notebook Web URL not found');
            }
            
            // Parse the URL to get the drive item ID
            const urlParts = notebook.links.oneNoteWebUrl.split('/');
            const driveIndex = urlParts.indexOf('drive');
            if (driveIndex === -1) throw new Error('Drive ID not found in notebook URL');
            const driveId = urlParts[driveIndex + 1];
            const itemId = urlParts[urlParts.indexOf('item') + 1];
            
            // Create a sharing link with "view" permissions for anyone
            await client
                .api(`/drives/${driveId}/items/${itemId}/createLink`)
                .post({
                    type: 'view',
                    scope: 'anonymous'
                });
                
            console.log('Notebook shared successfully');
        } catch (error) {
            console.error('Error sharing notebook:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to share notebook: ${error.message}`);
            }
            throw new Error('Failed to share notebook: Unknown error');
        }
    }

    async findNotebookByName(name: string): Promise<Notebook | null> {
        try {
            const notebooks = await this.getNotebooks();
            return notebooks.find(nb => nb.displayName === name) || null;
        } catch (error) {
            console.error('Error finding notebook:', error);
            return null;
        }
    }

    async getNotebooks(): Promise<Notebook[]> {
        try {
            console.log('Fetching notebooks...');
            const client = authService.getGraphClient();
            const response = await client
                .api('/me/onenote/notebooks')
                .select('id,displayName,links,createdDateTime')
                .get();
            console.log('Notebooks response:', response);
            return response.value || [];
        } catch (error) {
            console.error('Error fetching notebooks:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to fetch notebooks: ${error.message}`);
            }
            throw new Error('Failed to fetch notebooks: Unknown error');
        }
    }

    async getSections(notebookId: string): Promise<OnenoteSection[]> {
        const client = authService.getGraphClient();
        const response = await client
            .api(`/me/onenote/notebooks/${notebookId}/sections`)
            .select('id,displayName,createdDateTime')
            .get();
        return response.value;
    }

    async getPages(sectionId: string): Promise<OnenotePage[]> {
        const client = authService.getGraphClient();
        const response = await client
            .api(`/me/onenote/sections/${sectionId}/pages`)
            .select('id,title,createdDateTime,contentUrl')
            .get();
        return response.value;
    }

    async getPageContent(pageId: string): Promise<string> {
        const client = authService.getGraphClient();
        const response = await client
            .api(`/me/onenote/pages/${pageId}/content`)
            .get();
        return response;
    }

    async searchPages(searchTerm: string): Promise<OnenotePage[]> {
        const client = authService.getGraphClient();
        const response = await client
            .api('/me/onenote/pages')
            .search(searchTerm)
            .select('id,title,createdDateTime,contentUrl')
            .get();
        return response.value;
    }
}

export const oneNoteService = new OneNoteService();
