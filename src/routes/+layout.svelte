<script lang="ts">
	import './layout.css';
	import faviconBlack from '$lib/assets/favicon-black.svg';
	import faviconWhite from '$lib/assets/favicon-white.svg';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import type { LayoutProps } from './$types';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={faviconBlack} media="(prefers-color-scheme: light)" />
	<link rel="icon" type="image/svg+xml" href={faviconWhite} media="(prefers-color-scheme: dark)" />
	<title>ZenAI Poker Dashboard</title>
</svelte:head>

<Tooltip.Provider>
	<Sidebar.Provider>
		<AppSidebar players={data.players} sessions={data.sessions} />
		<Sidebar.Inset>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
</Tooltip.Provider>
