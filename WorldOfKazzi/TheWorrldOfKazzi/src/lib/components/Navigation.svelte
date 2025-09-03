<script lang="ts">
    import { page } from '$app/stores';
    import Header from './Header/Header.svelte';
    import Icon from './Icon.svelte';
</script>

<nav class="nav-bar">
    <div class="nav-list">
        <a href="/Aldyra" class="quick-link">
            <Icon name="castle" size={20} />
        </a>
        <a href="/Bosses" class="quick-link">
            <Icon name="skull" size={20} />
        </a>
        <a href="/Dungeons" class="quick-link">
            <Icon name="dungeon" size={20} />
        </a>
        <a href="/NPCs" class="quick-link">
            <Icon name="people" size={20} />
        </a>
        <a href="/Resources" class="quick-link">
            <Icon name="book" size={20} />
        </a>
    </div>
</nav>
