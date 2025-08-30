<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotebook, getNotebookPages, getPageContent } from '$lib/services/onenote-direct';

    const NOTEBOOK_ID = '0-2A982C9E458A03FE';
    let pages = [];
    let loading = true;
    let error = null;
    let selectedPageContent = null;

    onMount(async () => {
        try {
            loading = true;
            // Get notebook info
            const notebook = await getNotebook(NOTEBOOK_ID);
            console.log('Notebook:', notebook);
            
            // Get all pages
            const notebookPages = await getNotebookPages(NOTEBOOK_ID);
            pages = notebookPages;
            console.log('Pages:', pages);
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
        } finally {
            loading = false;
        }
    });

    async function loadPageContent(pageId: string) {
        try {
            selectedPageContent = await getPageContent(pageId);
        } catch (err) {
            console.error('Error loading page:', err);
            error = `Failed to load page: ${err.message}`;
        }
    }
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
