<!-- src/routes/section/[id]/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { oneNoteService } from '$lib/services/onenote.service.js';
    import { onMount } from 'svelte';
    import type { OnenotePage } from '@microsoft/microsoft-graph-types';

    const sectionId = $page.params.id;
    let pages: OnenotePage[] = [];
    let loading = true;

    onMount(async () => {
        try {
            if (!sectionId) {
                throw new Error('Section ID is required');
            }
            pages = await oneNoteService.getPages();
        } catch (error) {
            console.error('Error loading pages:', error);
        } finally {
            loading = false;
        }
    });
</script>

<div class="section-container">
    {#if loading}
        <div class="loading-message">Loading pages...</div>
    {:else}
        <div class="pages-list">
            {#each pages as page}
                <a
                    href="/page/{page.id}"
                    class="page-link"
                >
                    <h2 class="page-title">{page.title}</h2>
                    <p class="page-meta">
                        Created: {page.createdDateTime ? new Date(page.createdDateTime).toLocaleDateString() : 'Unknown'}
                    </p>
                </a>
            {/each}
        </div>

        {#if pages.length === 0}
            <p class="no-pages-message">No pages found in this section.</p>
        {/if}
    {/if}
</div>
