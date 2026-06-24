<script lang="ts">
	import './layout.css';
	import faviconBlack from '$lib/assets/favicon-black.svg';
	import faviconWhite from '$lib/assets/favicon-white.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={faviconBlack} media="(prefers-color-scheme: light)" />
	<link rel="icon" type="image/svg+xml" href={faviconWhite} media="(prefers-color-scheme: dark)" />
	<title>ZenAI Poker Dashboard</title>
</svelte:head>
{@render children()}
