<!-- src/routes/section/[id]/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { publicOneNoteService } from '$lib/services/public-onenote.service.js';
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
            pages = await publicOneNoteService.getPages(sectionId);
        } catch (error) {
            console.error('Error loading pages:', error);
        } finally {
            loading = false;
        }
    });
</script>

<div class="max-w-4xl mx-auto">
    {#if loading}
        <div class="text-center py-8">Loading pages...</div>
    {:else}
        <div class="space-y-4">
            {#each pages as page}
                <a
                    href="/page/{page.id}"
                    class="block p-4 border rounded hover:bg-gray-50"
                >
                    <h2 class="text-xl font-medium">{page.title}</h2>
                    <p class="text-gray-600 text-sm">
                        Created: {page.createdDateTime ? new Date(page.createdDateTime).toLocaleDateString() : 'Unknown'}
                    </p>
                </a>
            {/each}
        </div>

        {#if pages.length === 0}
            <p class="text-center py-8 text-gray-600">No pages found in this section.</p>
        {/if}
    {/if}
</div>
