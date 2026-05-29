<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { Sun, Moon } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	let dark = $state(false);

	function toggle() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	}

	onMount(() => {
		dark = document.documentElement.classList.contains('dark');
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex min-h-screen">
	<aside class="flex w-64 flex-col border-r bg-muted/30 p-4">
		<a href={resolve('/')} class="mb-6 text-xl font-bold tracking-tight">🃏 ZenPoker</a>
		<nav class="flex flex-col gap-1">
			<a
				href={resolve('/')}
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url
					.pathname === '/'
					? 'bg-muted'
					: ''}"
			>
				Dashboard
			</a>
			<a
				href={resolve('/games')}
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname.startsWith(
					'/games'
				)
					? 'bg-muted'
					: ''}"
			>
				Games
			</a>
		</nav>
		<div class="my-2 border-t"></div>
		<span class="mb-1 px-3 text-xs font-medium text-muted-foreground">Players</span>
		<nav class="flex flex-col gap-1">
			{#each $page.data.identities as identity (identity.playerIds[0])}
				<a
					href={resolve('/players/' + identity.playerIds[0])}
					class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname.includes(
						identity.playerIds[0]
					)
						? 'bg-muted'
						: ''}"
				>
					{identity.displayName}
				</a>
			{/each}
		</nav>
		<div class="mt-auto pt-4">
			<button
				onclick={toggle}
				class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
			>
				{#if dark}
					<Sun class="size-4" />
					Light Mode
				{:else}
					<Moon class="size-4" />
					Dark Mode
				{/if}
			</button>
		</div>
	</aside>
	<main class="flex-1 p-6">
		{@render children()}
	</main>
</div>
