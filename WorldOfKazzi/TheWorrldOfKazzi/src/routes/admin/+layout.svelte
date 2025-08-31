<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { AuthService } from '$lib/services/auth.service.js';
    import { loginRequest } from '$lib/services/auth.config.js';
    import { DndNotebookService } from '$lib/services/dnd-notebook.service.js';

    let isAuthenticated = false;
    let isLoading = true;

    onMount(async () => {
        const authService = AuthService.getInstance();
        const notebookService = DndNotebookService.getInstance();

        try {
            await authService.initialize();
            
            const account = authService.msalInstance.getAllAccounts()[0];
            if (!account) {
                await authService.msalInstance.loginRedirect(loginRequest);
                return;
            }

            await notebookService.initialize();
            await notebookService.refreshPages();
            isAuthenticated = true;
        } catch (error) {
            console.error('Authentication failed:', error);
            goto('/');
        } finally {
            isLoading = false;
        }
    });
</script>

{#if isLoading}
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-xl">Loading...</div>
    </div>
{:else if isAuthenticated}
    <slot />
{/if}
