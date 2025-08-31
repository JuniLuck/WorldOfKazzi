// Public OneNote service that calls our server-side API endpoints
import type { OnenoteSection, OnenotePage } from '@microsoft/microsoft-graph-types';

export class PublicOneNoteService {
    async getSections(): Promise<OnenoteSection[]> {
        try {
            const response = await fetch('/api/sections');
            if (!response.ok) {
                throw new Error(`Failed to fetch sections: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching sections:', error);
            throw new Error('Failed to fetch sections');
        }
    }

    async getPages(sectionId: string): Promise<OnenotePage[]> {
        try {
            const response = await fetch(`/api/sections/${sectionId}/pages`);
            if (!response.ok) {
                throw new Error(`Failed to fetch pages: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching pages:', error);
            throw new Error('Failed to fetch pages');
        }
    }

    async getPageContent(pageId: string): Promise<string> {
        try {
            const response = await fetch(`/api/pages/${pageId}/content`);
            if (!response.ok) {
                throw new Error(`Failed to fetch page content: ${response.status}`);
            }
            const data = await response.json();
            return data.content;
        } catch (error) {
            console.error('Error fetching page content:', error);
            throw new Error('Failed to fetch page content');
        }
    }
}

export const publicOneNoteService = new PublicOneNoteService();
