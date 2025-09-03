<script lang="ts">
    export let name: string;
    export let size: number = 16;
    
    const icons = {
        castle: "M12 3L2 8v13h20V8L12 3zm0 2.5L19.5 10v9h-15v-9L12 5.5z M10 12h4v7h-4z",
        skull: "M12 2C8.13 2 5 5.13 5 9c0 1.74.64 3.34 1.69 4.58L12 22l5.31-8.42C18.36 12.34 19 10.74 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        dungeon: "M6 2L3 6v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6l-3-4H6zm0 2h12l2 3v13H4V7l2-3z M12 8L8 12h3v6h2v-6h3l-4-4z",
        people: "M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm5 4.5c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2z M17.5 10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM2.5 10.5C3.33 10.5 4 9.83 4 9s-.67-1.5-1.5-1.5S1 8.17 1 9s.67 1.5 1.5 1.5z M6 16m-2 0a2 2 0 1 1 4 0a2 2 0 1 1 -4 0 M12 20m-2 0a2 2 0 1 1 4 0a2 2 0 1 1 -4 0 M18 16m-2 0a2 2 0 1 1 4 0a2 2 0 1 1 -4 0",
        book: "M6 2c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"
    };
    
    $: iconPath = icons[name as keyof typeof icons] || "";
</script>

<svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
>
    <path d={iconPath} />
</svg>
