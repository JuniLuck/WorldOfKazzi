import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { oneNoteService } from '$lib/services/onenote.service.js';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { notebookName } = await request.json();
        
        if (!notebookName) {
            throw error(400, 'Notebook name is required');
        }

        // Find the notebook by name
        const notebook = await oneNoteService.findNotebookByName(notebookName);
        
        if (!notebook || !notebook.id) {
            throw error(404, `Notebook "${notebookName}" not found or has no ID`);
        }

        // Share the notebook
        await oneNoteService.shareNotebook(notebook.id);

        return json({ success: true });
    } catch (e) {
        console.error('Error sharing notebook:', e);
        if (e instanceof Error) {
            throw error(500, e.message);
        }
        throw error(500, 'An unknown error occurred while sharing the notebook');
    }
};
