<!-- Navigation.svelte -->
<script lang="ts">
    import { azureAuthService } from '$lib/services/azure-auth.js';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { Client } from '@microsoft/microsoft-graph-client';
    import type { Notebook, OnenoteSection } from '@microsoft/microsoft-graph-types';
    import { tokenManager } from '$lib/services/token-manager.js';

    let notebooks: Notebook[] = [];
    let expandedNotebooks: Set<string> = new Set();
    let sections: { [key: string]: OnenoteSection[] } = {};
    let isLoggedIn = false;
    let isLoading = true;
    let error: string | null = null;
    let loadingSections: Set<string> = new Set();

    onMount(async () => {
        if (!browser) return;
        
        try {
            await azureAuthService.initialize();
            const token = await tokenManager.getValidToken().catch(() => null);
            if (token) {
                isLoggedIn = true;
                await loadNotebooks();
            }
        } catch (error) {
            console.error('Error initializing:', error);
            error = 'Failed to initialize application';
        } finally {
            isLoading = false;
        }
    });

    async function getGraphClient() {
        return Client.init({
            authProvider: tokenManager.createAuthProvider()
        });
    }

    async function loadNotebooks() {
        try {
            const client = await getGraphClient();
            const response = await client
                .api('/users/{user-id}/onenote/notebooks')
                .select('id,displayName,links,createdDateTime')
                .version('beta')  // Use beta endpoint for better personal account support
                .get();
            notebooks = response.value || [];
            console.log('Notebooks response:', response);
        } catch (error) {
            console.error('Error loading notebooks:', error);
            // Log the full error for debugging
            console.error('Full error:', JSON.stringify(error, null, 2));
            throw error;
        }
    }

    async function toggleNotebook(notebookId: string) {
        if (!expandedNotebooks.has(notebookId)) {
            expandedNotebooks.add(notebookId);
            loadingSections.add(notebookId);
            loadingSections = loadingSections; // trigger reactivity
            
            try {
                const client = await getGraphClient();
                const response = await client
                    .api(`/users/{user-id}/onenote/notebooks/${notebookId}/sections`)
                    .select('id,displayName,createdDateTime')
                    .version('beta')  // Use beta endpoint for better personal account support
                    .get();
                sections[notebookId] = response.value;
                sections = sections; // trigger reactivity
            } catch (error) {
                console.error('Error loading sections:', error);
                error = `Failed to load sections for notebook: ${error.message}`;
                expandedNotebooks.delete(notebookId);
            } finally {
                loadingSections.delete(notebookId);
                loadingSections = loadingSections; // trigger reactivity
            }
        } else {
            expandedNotebooks.delete(notebookId);
        }
        expandedNotebooks = expandedNotebooks; // trigger reactivity
    }

    async function handleLogin() {
        try {
            console.log('Starting login process...');
            const result = await azureAuthService.login();
            console.log('Login result:', result);
            if (result) {
                isLoggedIn = true;
                console.log('Loading notebooks...');
                await loadNotebooks();
                console.log('Notebooks loaded:', notebooks);
            } else {
                error = 'Login failed - no result returned';
            }
        } catch (err) {
            console.error('Login error:', err);
            error = `Login failed: ${err.message}`;
        }
    }

    async function handleLogout() {
        try {
            await azureAuthService.logout();
            isLoggedIn = false;
            notebooks = [];
            sections = {};
            expandedNotebooks.clear();
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
</script>

<nav class="w-64 bg-gray-100 min-h-screen p-4">
    <div class="mb-4">
        {#if isLoggedIn}
            <button
                on:click={handleLogout}
                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
                Logout
            </button>
        {:else}
            <button
                on:click={handleLogin}
                disabled={isLoading}
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
                {#if isLoading}
                    Initializing...
                {:else}
                    Login with Microsoft
                {/if}
            </button>
        {/if}
    </div>

    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p class="text-sm">{error}</p>
        </div>
    {/if}

    {#if isLoggedIn}
        {#if isLoading}
            <div class="text-gray-600 text-center py-4">Loading notebooks...</div>
        {:else if notebooks.length === 0}
            <div class="text-gray-600 text-center py-4">No notebooks found</div>
        {:else}
            <div class="space-y-2">
                {#each notebooks as notebook}
                    <div class="border-b border-gray-200 pb-2">
                        <button
                            class="flex items-center space-x-2 w-full hover:bg-gray-200 p-2 rounded"
                            on:click={() => toggleNotebook(notebook.id)}
                            disabled={loadingSections.has(notebook.id)}
                        >
                            <span class="text-lg">
                                {#if loadingSections.has(notebook.id)}
                                    ⋯
                                {:else}
                                    {expandedNotebooks.has(notebook.id) ? '▼' : '▶'}
                                {/if}
                            </span>
                            <span>{notebook.displayName}</span>
                        </button>

                        {#if expandedNotebooks.has(notebook.id)}
                            <div class="ml-6 mt-2 space-y-1">
                                {#if loadingSections.has(notebook.id)}
                                    <div class="text-gray-600 text-sm py-2">Loading sections...</div>
                                {:else if sections[notebook.id]?.length === 0}
                                    <div class="text-gray-600 text-sm py-2">No sections found</div>
                                {:else}
                                    {#each sections[notebook.id] || [] as section}
                                        <a
                                            href="/section/{section.id}"
                                            class="block hover:bg-gray-200 p-2 rounded text-blue-600 hover:text-blue-800"
                                        >
                                            {section.displayName}
                                        </a>
                                    {/each}
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
</nav>
