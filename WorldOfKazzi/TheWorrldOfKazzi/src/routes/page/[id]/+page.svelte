<!-- src/routes/page/[id]/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { oneNoteService } from '$lib/services/onenote.service';
    import { onMount } from 'svelte';
    import { marked } from 'marked';

    const pageId = $page.params.id;
    let content = '';
    let loading = true;

    onMount(async () => {
        try {
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

<div class="max-w-4xl mx-auto">
    {#if loading}
        <div class="text-center py-8">Loading page content...</div>
    {:else}
        <article class="prose max-w-none">
            {@html content}
        </article>
    {/if}
</div>

<style>
    :global(.prose img) {
        max-width: 100%;
        height: auto;
    }

    :global(.prose table) {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
    }

    :global(.prose td),
    :global(.prose th) {
        border: 1px solid #ddd;
        padding: 8px;
    }

    :global(.prose tr:nth-child(even)) {
        background-color: #f2f2f2;
    }
</style>
