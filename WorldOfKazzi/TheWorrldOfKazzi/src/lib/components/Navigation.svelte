<!-- Navigation.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import type { OnenoteSection } from '@microsoft/microsoft-graph-types';
    import { publicOneNoteService } from '$lib/services/public-onenote.service.js';
    import { NOTEBOOK_CONFIG } from '$lib/services/notebook-config.js';

    let sections: OnenoteSection[] = [];
    let isLoading = true;
    let error: string | null = null;

    onMount(async () => {
        if (!browser) return;
        
        try {
            await loadSections();
        } catch (error) {
            console.error('Error initializing:', error);
            error = 'Failed to initialize application';
        } finally {
            isLoading = false;
        }
    });

    async function loadSections() {
        try {
            console.log('Loading sections from public API...');
            sections = await publicOneNoteService.getSections();
            console.log('DND notebook sections loaded:', sections);
        } catch (error) {
            console.error('Error loading sections:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load notebook sections';
            error = errorMessage;
        }
    }
</script>

<nav class="w-64 bg-gray-100 min-h-screen p-4">
    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p class="text-sm">{error}</p>
        </div>
    {/if}

    {#if isLoading}
        <div class="text-gray-600 text-center py-4">Loading sections...</div>
    {:else}
        <div class="space-y-2">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">
                    {NOTEBOOK_CONFIG.notebookName}
                </h2>
                <p class="text-sm text-gray-600">Public Access</p>
            </div>
            
            <div class="space-y-1 p-2">
                {#if sections.length === 0}
                    <div class="text-gray-600 text-sm py-2">No sections found</div>
                {:else}
                    {#each sections as section}
                        <a
                            href="/section/{section.id}"
                            class="block hover:bg-gray-100 p-2 rounded text-gray-700 hover:text-gray-900"
                        >
                            {section.displayName}
                        </a>
                    {/each}
                {/if}
            </div>
        </div>
    {/if}
</nav>
