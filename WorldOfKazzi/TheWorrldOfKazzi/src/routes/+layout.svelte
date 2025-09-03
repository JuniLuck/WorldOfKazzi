<!-- +layout.svelte -->
<script lang="ts">
    import '../app.css';
    import '../styles/main.scss';
    import Navigation from '$lib/components/Navigation.svelte';
</script>

<div class="layout-container">
    <Navigation />
    <main class="main-content">
        <slot />
    </main>
</div>
