<script lang="ts">
    interface Props {
        name: string;
        color?: string;
    }

    let { name, color }: Props = $props();

    let inheritColor = $derived(color === "inherit");
</script>

{#if name === "play"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {color}
        ><path
            fill="currentColor"
            d="M21.409 9.353a2.998 2.998 0 0 1 0 5.294L8.597 21.614C6.534 22.737 4 21.277 4 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648z"
        /></svg
    >
{:else if name === "pause"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {color}
        ><path
            fill="currentColor"
            d="M2 6c0-1.886 0-2.828.586-3.414S4.114 2 6 2s2.828 0 3.414.586S10 4.114 10 6v12c0 1.886 0 2.828-.586 3.414S7.886 22 6 22s-2.828 0-3.414-.586S2 19.886 2 18zm12 0c0-1.886 0-2.828.586-3.414S16.114 2 18 2s2.828 0 3.414.586S22 4.114 22 6v12c0 1.886 0 2.828-.586 3.414S19.886 22 18 22s-2.828 0-3.414-.586S14 19.886 14 18z"
        /></svg
    >
{:else if name === "skip"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" {color}
        ><path
            fill="currentColor"
            d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0z"
        /></svg
    >
{:else if name === "delete" || name === "remove"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {color}
        ><path
            fill="currentColor"
            d="M7 21q-.825 0-1.412-.587T5 19V6q-.425 0-.712-.288T4 5t.288-.712T5 4h4q0-.425.288-.712T10 3h4q.425 0 .713.288T15 4h4q.425 0 .713.288T20 5t-.288.713T19 6v13q0 .825-.587 1.413T17 21zm3-4q.425 0 .713-.288T11 16V9q0-.425-.288-.712T10 8t-.712.288T9 9v7q0 .425.288.713T10 17m4 0q.425 0 .713-.288T15 16V9q0-.425-.288-.712T14 8t-.712.288T13 9v7q0 .425.288.713T14 17"
        /></svg
    >
{:else if name === "download"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {color}
        ><path
            fill="currentColor"
            d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32v242.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-32c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352zm368 56a24 24 0 1 1 0 48a24 24 0 1 1 0-48"
        /></svg
    >
{/if}

<style>
    .inherit-color {
        color: inherit;
    }
</style>
