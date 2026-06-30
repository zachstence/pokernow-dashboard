<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<Tooltip.Provider>
	<Sidebar.Provider>
		<AppSidebar players={data.players} sessions={data.sessions} />
		<Sidebar.Inset>
			{@render children()}
		</Sidebar.Inset>
	</Sidebar.Provider>
</Tooltip.Provider>
