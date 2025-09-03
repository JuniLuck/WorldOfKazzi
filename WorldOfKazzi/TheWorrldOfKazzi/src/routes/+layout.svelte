<!-- +layout.svelte -->
<script lang="ts">
    import '../app.css';
    import '../styles/main.scss';
    import Navigation from '$lib/components/Navigation.svelte';
    import Header from '$lib/components/Header/Header.svelte';
</script>

<div class="layout-container">
    <Header />
    <div class="main-content">
        <Navigation />
        <main class="page-container">
            <slot />
        </main>
    </div>
</div>
