<!-- Navigation.svelte -->
<script lang="ts">
    import { azureAuthService } from '$lib/services/azure-auth.js';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { Client } from '@microsoft/microsoft-graph-client';
    import type { Notebook, OnenoteSection } from '@microsoft/microsoft-graph-types';
    import { tokenManager } from '$lib/services/token-manager.js';

    import { NOTEBOOK_CONFIG } from '$lib/services/notebook-config.js';
    let sections: OnenoteSection[] = [];
    let isLoggedIn = false;
    let isLoading = true;
    let error: string | null = null;

    onMount(async () => {
        if (!browser) return;
        
        try {
            await azureAuthService.initialize();
            const token = await tokenManager.getValidToken().catch(() => null);
            if (token) {
                isLoggedIn = true;
                await loadSections();
            }
        } catch (error) {
            console.error('Error initializing:', error);
            error = 'Failed to initialize application';
        } finally {
            isLoading = false;
        }
    });

    async function getGraphClient() {
        try {
            // Get a fresh Graph API token using the public method
            const token = await azureAuthService.acquireTokenForGraph();
            
            console.log('Got Graph token:', token ? 'Token exists' : 'No token');
            console.log('Graph token preview:', token.substring(0, 20) + '...');
            
            return Client.init({
                authProvider: (callback) => {
                    callback(null, token);
                }
            });
        } catch (error) {
            console.error('Error creating Graph client:', error);
            throw new Error('Failed to authenticate - please try logging in again');
        }
    }

    async function loadSections() {
        try {
            const client = await getGraphClient();
            
            // Directly get sections for the specific notebook
            try {
                console.log('Loading sections directly from notebook:', NOTEBOOK_CONFIG.notebookId);
                const response = await client
                    .api(`/me/onenote/notebooks/${NOTEBOOK_CONFIG.notebookId}/sections`)
                    .select('id,displayName,createdDateTime')
                    .get();
                
                sections = response.value || [];
                console.log('DND notebook sections loaded:', sections);
            } catch (e) {
                console.error('Error loading sections:', e);
                throw new Error('Unable to load notebook sections');
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load notebook sections';
            error = errorMessage;
        }
    }

    async function handleLogin() {
        try {
            console.log('Starting login process...');
            const result = await azureAuthService.login();
            console.log('Login result:', result);
            if (result) {
                isLoggedIn = true;
                console.log('Loading sections...');
                await loadSections();
                console.log('Sections loaded:', sections);
            } else {
                error = 'Login failed - no result returned';
            }
        } catch (err) {
            console.error('Login error:', err);
            error = `Login failed: ${err instanceof Error ? err.message : String(err)}`;
        }
    }

    async function handleLogout() {
        try {
            await azureAuthService.logout();
            isLoggedIn = false;
            sections = [];
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
            <div class="text-gray-600 text-center py-4">Loading sections...</div>
        {:else}
            <div class="space-y-2">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-800">
                        {NOTEBOOK_CONFIG.notebookName}
                    </h2>
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
    {/if}
</nav>
