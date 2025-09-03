<!-- src/lib/components/ShareNotebook.svelte -->
<script lang="ts">
    export let notebookName: string;
    let loading = false;
    let error: string | null = null;
    let success = false;

    async function shareNotebook() {
        loading = true;
        error = null;
        success = false;

        try {
            const response = await fetch('/api/notebook/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notebookName })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to share notebook');
            }

            success = true;
        } catch (e) {
            if (e instanceof Error) {
                error = e.message;
            } else {
                error = 'An unknown error occurred';
            }
        } finally {
            loading = false;
        }
    }
</script>

<div class="share-container">
    <button
        on:click={shareNotebook}
        disabled={loading}
        class="share-button"
    >
        {#if loading}
            Sharing...
        {:else}
            Share Notebook
        {/if}
    </button>

    {#if error}
        <p class="error-message">{error}</p>
    {/if}

    {#if success}
        <p class="success-message">Notebook shared successfully!</p>
    {/if}
</div>
