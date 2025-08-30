<!-- +layout.svelte -->
<script lang="ts">
    import '../app.css';
    import Navigation from '$lib/components/Navigation.svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { azureAuthService } from '$lib/services/azure-auth.js';
    
    onMount(async () => {
        // Initialize auth only in the browser
        if (browser) {
            try {
                console.log('Initializing auth service...');
                await azureAuthService.initialize();
                console.log('Auth service initialized successfully');
            } catch (error) {
                console.error('Failed to initialize auth:', error);
            }
        }
    });
</script>

<div class="flex min-h-screen">
    <Navigation />
    <main class="flex-1 p-8">
        <slot />
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
