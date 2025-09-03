<script lang="ts">
    import { page } from '$app/stores';
    import Header from './Header/Header.svelte';
</script>

<nav class="navigation">
    <div class="space-y-4">
        <div class="mt-8">
            <h3 class="quick-links-title">Quick Links</h3>
            <div class="space-y-1">
                <a href="/Aldyra" class="quick-link">Aldyra</a>
                <a href="/Bosses" class="quick-link">Bosses</a>
                <a href="/Dungeons" class="quick-link">Dungeons</a>
                <a href="/NPCs" class="quick-link">NPCs</a>
                <a href="/Resources" class="quick-link">Resources</a>
            </div>
        </div>
    </div>
</nav>
