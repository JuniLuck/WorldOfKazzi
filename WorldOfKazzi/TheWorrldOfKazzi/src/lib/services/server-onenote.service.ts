// Server-side OneNote service using certificate authentication
import type { Notebook, OnenoteSection, OnenotePage } from '@microsoft/microsoft-graph-types';
import { serverAuthService } from './server-auth-cert.service.js';
import { NOTEBOOK_CONFIG } from './notebook-config.js';

// The user ID of the notebook owner
const ONENOTE_USER_ID = process.env.ONENOTE_USER_ID || '';

export class ServerOneNoteService {
    async getNotebook(): Promise<Notebook> {
        try {
            const client = await serverAuthService.getGraphClient();
            const response = await client
                .api(`/users/${ONENOTE_USER_ID}/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}`)
                .get();
            return response;
        } catch (error) {
            console.error('Error fetching notebook:', error);
            throw new Error('Failed to fetch notebook');
        }
    }

    async getSections(): Promise<OnenoteSection[]> {
        try {
            const client = await serverAuthService.getGraphClient();
            const response = await client
                .api(`/users/${ONENOTE_USER_ID}/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/sections`)
                .select('id,displayName,createdDateTime')
                .get();
            return response.value || [];
        } catch (error) {
            console.error('Error fetching sections:', error);
            throw new Error('Failed to fetch sections');
        }
    }

    async getPages(sectionId: string): Promise<OnenotePage[]> {
        try {
            const client = await serverAuthService.getGraphClient();
            const response = await client
                .api(`/users/${ONENOTE_USER_ID}/onenote/sections/${sectionId}/pages`)
                .select('id,title,createdDateTime,contentUrl')
                .get();
            return response.value || [];
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw new Error('Failed to fetch pages');
        }
    }

    async getPageContent(pageId: string): Promise<string> {
        try {
            const client = await serverAuthService.getGraphClient();
            const response = await client
                .api(`/users/${ONENOTE_USER_ID}/onenote/pages/${pageId}/content`)
                .get();
            return response;
        } catch (error) {
            console.error('Error fetching page content:', error);
            throw new Error('Failed to fetch page content');
        }
    }
}

export const serverOneNoteService = new ServerOneNoteService();
