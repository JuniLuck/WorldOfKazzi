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

<div class="flex items-center space-x-2">
    <button
        on:click={shareNotebook}
        disabled={loading}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {#if loading}
            Sharing...
        {:else}
            Share Notebook
        {/if}
    </button>

    {#if error}
        <p class="text-red-500 text-sm">{error}</p>
    {/if}

    {#if success}
        <p class="text-green-500 text-sm">Notebook shared successfully!</p>
    {/if}
</div>
