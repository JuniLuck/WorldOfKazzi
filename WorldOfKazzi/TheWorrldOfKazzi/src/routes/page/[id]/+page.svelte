<!-- src/routes/page/[id]/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { oneNoteService } from '$lib/services/onenote.service.js';
    import { onMount } from 'svelte';
    import { marked } from 'marked';

    const pageId = $page.params.id;
    let content = '';
    let loading = true;

    onMount(async () => {
        try {
            if (!pageId) {
                throw new Error('Page ID is required');
            }
            const rawContent = await oneNoteService.getPageContent(pageId);
            content = processOneNoteContent(rawContent);
        } catch (error) {
            console.error('Error loading page content:', error);
        } finally {
            loading = false;
        }
    });

    function processOneNoteContent(htmlContent: string): string {
        // Convert OneNote HTML to more wiki-friendly format
        // This is a basic implementation - you might want to enhance it
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        // Remove OneNote-specific elements and classes
        doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        
        // Convert to markdown-like format
        const cleanHtml = doc.body.innerHTML;
        return cleanHtml;
    }
</script>

<div class="page-container">
    {#if loading}
        <div class="loading-message">Loading page content...</div>
    {:else}
        <article class="page-article prose">
            {@html content}
        </article>
    {/if}
</div>
