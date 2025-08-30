<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { dndNotebookService, notebookPages, notebookError, isLoading } from '$lib/services/dnd-notebook.service.js';
    import { NOTEBOOK_CONFIG } from '../lib/services/notebook-config.js';

    // Define the type for a notebook page
    type NotebookPage = {
        id: string;
        title: string;
        // add other properties if needed
    };

    let selectedPageContent: string | null = null;
    
    // Use the Svelte stores
    $: pages = $notebookPages as NotebookPage[];
    $: error = $notebookError;
    $: loading = $isLoading;

    async function loadPageContent(pageId: string) {
        try {
            selectedPageContent = await dndNotebookService.getPageContent(pageId);
        } catch (err) {
            console.error('Error loading page:', err);
            if (err instanceof Error) {
                notebookError.set(err.message);
            }
        }
    }

    // Clean up when the component is destroyed
    onDestroy(() => {
        dndNotebookService.cleanup();
    });
</script>

<div class="max-w-4xl mx-auto p-4">
    {#if loading}
        <div class="text-center py-8">Loading notebook content...</div>
    {:else if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
            <p class="text-sm">{error}</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Notebook Header -->
            <div class="mb-4">
                <h2 class="text-xl font-bold mb-2">DND Notes</h2>
                <p class="text-sm text-gray-600">
                    Auto-refreshes every {Math.round(NOTEBOOK_CONFIG.refreshInterval / 1000)} seconds
                </p>
            </div>
            
            <!-- Pages List -->
            <div class="border-r pr-4">
                <h2 class="text-xl font-bold mb-4">Pages</h2>
                <div class="space-y-2">
                    {#each pages as page}
                        <button
                            class="w-full text-left p-2 hover:bg-gray-100 rounded"
                            on:click={() => loadPageContent(page.id)}
                        >
                            {page.title}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Page Content -->
            <div class="col-span-2">
                {#if selectedPageContent}
                    <div class="prose max-w-none">
                        {@html selectedPageContent}
                    </div>
                {:else}
                    <div class="text-center text-gray-500 py-8">
                        Select a page to view its content
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
