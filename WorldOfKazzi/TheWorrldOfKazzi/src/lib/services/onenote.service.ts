import type { Notebook, OnenoteSection, OnenotePage } from '@microsoft/microsoft-graph-types';
import { authService } from './auth.service';
import { authConfig } from './auth.config';

export class OneNoteService {
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
            throw new Error(`Failed to fetch notebooks: ${error.message}`);
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
