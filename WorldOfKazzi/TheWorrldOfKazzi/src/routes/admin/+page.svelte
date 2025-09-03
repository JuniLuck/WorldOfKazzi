<!-- Move the authentication and OneNote functionality here -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { DndNotebookService, notebookPages, notebookError, isLoading } from '$lib/services/dnd-notebook.service.js';
    import { NOTEBOOK_CONFIG } from '../../lib/services/notebook-config.js';

    // Initialize the notebook service
    const dndNotebookService = DndNotebookService.getInstance();

    // Define the type for a notebook page
    type NotebookPage = {
        id: string;
        title: string;
        content?: string;
    };

    let selectedPageContent: string | null = null;
    
    // Use the Svelte stores
    $: pages = $notebookPages as NotebookPage[];
    $: error = $notebookError;
    $: loading = $isLoading;

    // Local storage key
    const STORED_PAGES_KEY = 'stored_dnd_pages';

    // Function to save a page to local storage
    async function savePage(pageId: string) {
        try {
            const content = await dndNotebookService.getPageContent(pageId);
            const pageToSave = pages.find(p => p.id === pageId);
            if (!pageToSave) return;

            const storedPages = JSON.parse(localStorage.getItem(STORED_PAGES_KEY) || '[]');
            storedPages.push({
                id: pageId,
                title: pageToSave.title,
                content,
                savedAt: new Date().toISOString()
            });
            localStorage.setItem(STORED_PAGES_KEY, JSON.stringify(storedPages));
            alert('Page saved successfully!');
        } catch (err) {
            console.error('Error saving page:', err);
            alert('Failed to save page');
        }
    }

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

<div class="admin-container">
    <div class="admin-header">
        <h1 class="admin-title">Admin Dashboard</h1>
        <a href="/" class="home-link">Back to Home</a>
    </div>

    {#if loading}
        <div class="loading-message">Loading notebook content...</div>
    {:else if error}
        <div class="error-message">{error}</div>
    {:else}
        <div class="admin-grid">
            <!-- Notebook Header -->
            <div class="status-info">
                <h2 class="status-title">DND Notes</h2>
                <p class="status-text">
                    Auto-refreshes every {Math.round(NOTEBOOK_CONFIG.refreshInterval / 1000)} seconds
                </p>
            </div>
            
            <!-- Pages List -->
            <div class="pages-sidebar">
                <h2 class="sidebar-title">Pages</h2>
                <div class="page-list">
                    {#each pages as page}
                        <div class="page-item">
                            <button
                                class="page-button"
                                on:click={() => loadPageContent(page.id)}
                            >
                                {page.title}
                            </button>
                            <button
                                class="save-button"
                                on:click={() => savePage(page.id)}
                            >
                                Save
                            </button>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- Page Content -->
            <div class="content-area-full">
                {#if selectedPageContent}
                    <div class="page-content">
                        {@html selectedPageContent}
                    </div>
                {:else}
                    <div class="content-placeholder">
                        <p class="placeholder-text">Select a page to view its content</p>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>
