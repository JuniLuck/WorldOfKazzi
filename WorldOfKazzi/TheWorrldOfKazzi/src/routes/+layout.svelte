<!-- +layout.svelte -->
<script lang="ts">
    import '../app.css';
    import Navigation from '$lib/components/Navigation.svelte';
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
