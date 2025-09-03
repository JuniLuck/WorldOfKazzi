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

<div class="home-container">
    <div class="home-header">
        <h1 class="home-title">DND Notes</h1>
        <a href="/admin" class="admin-link">Admin Panel</a>
    </div>

    {#if storedPages.length === 0}
        <div class="no-pages-message">
            No pages have been saved yet. Visit the admin panel to save pages.
        </div>
    {:else}
        <div class="pages-grid">
            <!-- Pages List -->
            <div class="pages-sidebar">
                <h2 class="pages-list-title">Saved Pages</h2>
                <div class="pages-list">
                    {#each storedPages as page}
                        <button
                            class="page-item"
                            on:click={() => selectedPage = page}
                        >
                            <div class="page-title">{page.title}</div>
                            <div class="page-date">
                                Saved: {new Date(page.savedAt).toLocaleDateString()}
                            </div>
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Page Content -->
            <div class="page-content">
                {#if selectedPage}
                    <div class="prose">
                        {@html selectedPage.content}
                    </div>
                {:else}
                    <div class="empty-content">
                        Select a page to view its content
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
