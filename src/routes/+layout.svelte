<script lang="ts">
	import './layout.css';
	import faviconBlack from '$lib/assets/favicon-black.svg';
	import faviconWhite from '$lib/assets/favicon-white.svg';
	import type { LayoutProps } from './$types';
	import { ModeWatcher } from 'mode-watcher';
	import inter from '@fontsource-variable/inter?url';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="preload" as="font" type="font/woff2" href={inter} crossorigin="anonymous" />
	<link rel="icon" type="image/svg+xml" href={faviconBlack} media="(prefers-color-scheme: light)" />
	<link rel="icon" type="image/svg+xml" href={faviconWhite} media="(prefers-color-scheme: dark)" />
	<title>ZenAI Poker Dashboard</title>
</svelte:head>

<ModeWatcher />

{@render children?.()}
