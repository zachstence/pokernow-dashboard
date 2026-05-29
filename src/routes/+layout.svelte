<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { Sun, Moon, ChevronRight } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';

	let { children } = $props();

	let dark = $state(false);
	let gamesOpen = $state(true);
	let playersOpen = $state(true);

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

<div class="flex h-screen">
	<aside class="flex w-64 shrink-0 flex-col border-r bg-muted/30 p-4">
		<a href="/" class="mb-6 text-xl font-bold tracking-tight">🃏 ZenPoker</a>
		<nav class="flex flex-col gap-1">
			<a
				href="/"
				class="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url
					.pathname === '/'
					? 'bg-muted'
					: ''}"
			>
				Overview
			</a>

			<Collapsible.Root bind:open={gamesOpen}>
				<div class="flex items-center">
					<a
						href="/games"
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname ===
						'/games'
							? 'bg-muted'
							: ''}"
					>
						Games
					</a>
					<Collapsible.Trigger
						class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ChevronRight
							class="size-4 transition-transform {gamesOpen ? 'rotate-90' : ''}"
						/>
					</Collapsible.Trigger>
				</div>
				<Collapsible.Content>
					<div class="relative ml-3 mt-1 border-l pl-3">
						{#each $page.data.games as game (game.game.gameId)}
							<a
								href={'/games/' + game.game.gameId}
								class="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname.includes(
									game.game.gameId
								)
									? 'bg-muted'
									: ''}"
							>
								{new Date(game.startTime).toLocaleDateString()}
							</a>
						{/each}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>

			<Collapsible.Root bind:open={playersOpen}>
				<div class="flex items-center">
					<a
						href="/players"
						class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname ===
						'/players'
							? 'bg-muted'
							: ''}"
					>
						Players
					</a>
					<Collapsible.Trigger
						class="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ChevronRight
							class="size-4 transition-transform {playersOpen ? 'rotate-90' : ''}"
						/>
					</Collapsible.Trigger>
				</div>
				<Collapsible.Content>
					<div class="relative ml-3 mt-1 border-l pl-3">
						{#each $page.data.identities as identity (identity.playerIds[0])}
							<a
								href={'/players/' + identity.playerIds[0]}
								class="block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted {$page.url.pathname.includes(
									identity.playerIds[0]
								)
									? 'bg-muted'
									: ''}"
							>
								{identity.displayName}
							</a>
						{/each}
					</div>
				</Collapsible.Content>
			</Collapsible.Root>
		</nav>
		<div class="mt-auto pt-4">
			<div class="mb-2 border-t"></div>
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
	<main class="flex-1 overflow-y-auto p-6">
		{@render children()}
	</main>
</div>
