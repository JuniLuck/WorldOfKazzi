<!-- Navigation.svelte -->
<script lang="ts">
    import { azureAuthService } from '$lib/services/azure-auth.js';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import type { OnenoteSection } from '@microsoft/microsoft-graph-types';
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

    async function loadSections() {
        try {
            // Direct fetch to the known DND notebook using its ID
            const token = await azureAuthService.acquireTokenForGraph();
            console.log('=== Direct Fetch: DND Note Sections Only ===');
            
            // Use the notebook ID from config to directly get sections
            const notebookId = '0-2A982C9E458A03FE!28254';
            console.log('Fetching sections from notebook ID:', notebookId);
            
            const sectionsResponse = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/notebooks/${notebookId}/sections`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!sectionsResponse.ok) {
                const errorText = await sectionsResponse.text();
                console.error('Direct sections fetch failed:', sectionsResponse.status, errorText);
                
                // If direct approach fails, we might need to find the notebook by name
                console.log('Direct ID failed, searching by name...');
                
                const notebooksResponse = await fetch('https://graph.microsoft.com/v1.0/me/onenote/notebooks', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!notebooksResponse.ok) {
                    throw new Error(`OneNote API failed: ${notebooksResponse.status}`);
                }
                
                const notebooksData = await notebooksResponse.json();
                const dndNotebook = notebooksData.value?.find(nb => 
                    nb.displayName?.toLowerCase().includes('dnd note')
                );
                
                if (!dndNotebook) {
                    throw new Error('DND notebook not found');
                }
                
                console.log('Found DND notebook by name:', dndNotebook.displayName);
                console.log('Using notebook ID:', dndNotebook.id);
                
                // Try again with the correct ID
                const retryResponse = await fetch(`https://graph.microsoft.com/v1.0/me/onenote/notebooks/${dndNotebook.id}/sections`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!retryResponse.ok) {
                    const retryError = await retryResponse.text();
                    throw new Error(`Sections fetch failed: ${retryResponse.status} - ${retryError}`);
                }
                
                const sectionsData = await retryResponse.json();
                sections = sectionsData.value || [];
                
            } else {
                const sectionsData = await sectionsResponse.json();
                sections = sectionsData.value || [];
            }
            
            console.log('SUCCESS: DND note sections loaded:', sections.length);
            
            if (sections.length > 0) {
                console.log('Sections:');
                sections.forEach(section => {
                    console.log(`  - ${section.displayName}`);
                });
            }
            
        } catch (error) {
            console.error('Error loading sections:', error);
            error = error instanceof Error ? error.message : 'Failed to load DND notebook sections';
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
