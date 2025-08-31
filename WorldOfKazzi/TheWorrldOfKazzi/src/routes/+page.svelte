<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    type StoredPage = {
        id: string;
        title: string;
        content: string;
        savedAt: string;
    };

    let storedPages: StoredPage[] = [];
    let selectedPage: StoredPage | null = null;

    // Local storage key
    const STORED_PAGES_KEY = 'stored_dnd_pages';

    function loadStoredPages() {
        if (browser) {
            const stored = localStorage.getItem(STORED_PAGES_KEY);
            if (stored) {
                storedPages = JSON.parse(stored);
            }
        }
    }

    onMount(() => {
        loadStoredPages();
    });
</script>

<div class="max-w-4xl mx-auto p-4">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">DND Notes</h1>
        <a href="/admin" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Admin Panel</a>
    </div>

    {#if storedPages.length === 0}
        <div class="text-center py-8 text-gray-500">
            No pages have been saved yet. Visit the admin panel to save pages.
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Pages List -->
            <div class="border-r pr-4">
                <h2 class="text-xl font-bold mb-4">Saved Pages</h2>
                <div class="space-y-2">
                    {#each storedPages as page}
                        <button
                            class="w-full text-left p-2 hover:bg-gray-100 rounded"
                            on:click={() => selectedPage = page}
                        >
                            <div class="font-medium">{page.title}</div>
                            <div class="text-sm text-gray-500">
                                Saved: {new Date(page.savedAt).toLocaleDateString()}
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Page Content -->
            <div class="col-span-2">
                {#if selectedPage}
                    <div class="prose max-w-none">
                        {@html selectedPage.content}
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
