<script lang="ts">
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { ComponentProps } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PlayersFile } from '$lib/server/transform-data/loadPlayersFile';
	import favicon from '$lib/assets/favicon.svg?raw';
	import { page } from '$app/state';
	import Button from './ui/button/button.svelte';
	import ModeToggle from './ModeSwitcher.svelte';
	import GithubIcon from '@iconify-svelte/line-md/github';

	type Props = {
		sessions: {
			title: string;
			url: string;
		}[];
		players: PlayersFile;
	};

	let {
		ref = $bindable(null),
		sessions,
		players,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & Props = $props();

	const data = $derived({
		navMain: [
			{
				title: 'Overview',
				url: resolve('/')
			},
			{
				title: 'Sessions',
				items: sessions
			},
			{
				title: 'Players',
				items: players.map((p) => ({ title: p.displayName, url: resolve(`/players/${p.id}`) }))
			}
		]
	});
</script>

<Sidebar.Root bind:ref {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href={resolve('/')} {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center text-foreground *:size-full!"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html favicon}
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-medium">ZenAI Poker Dashboard</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="flex flex-col justify-between">
		<Sidebar.Group>
			<Sidebar.Menu>
				{#each data.navMain as item (item.title)}
					{#if item.items}
						<Collapsible.Root open class="group/collapsible">
							<Sidebar.MenuItem>
								<Collapsible.Trigger>
									{#snippet child({ props })}
										<Sidebar.MenuButton {...props}>
											{item.title}
											<ChevronRightIcon
												class="ms-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
											/>
										</Sidebar.MenuButton>
									{/snippet}
								</Collapsible.Trigger>
								{#if item.items?.length}
									<Collapsible.Content>
										<Sidebar.MenuSub>
											{#each item.items as subItem (subItem.title)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton isActive={page.url.pathname === subItem.url}>
														{#snippet child({ props })}
															<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
															<a href={subItem.url} {...props}>{subItem.title}</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/each}
										</Sidebar.MenuSub>
									</Collapsible.Content>
								{/if}
							</Sidebar.MenuItem>
						</Collapsible.Root>
					{:else}
						<Sidebar.MenuButton isActive={page.url.pathname === item.url}>
							{#snippet child({ props })}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a href={item.url} {...props}>{item.title}</a>
							{/snippet}
						</Sidebar.MenuButton>
					{/if}
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<div class="flex items-center justify-center">
			<ModeToggle />
			<Button
				variant="ghost"
				size="icon"
				href="https://github.com/zachstence/pokernow-dashboard"
				target="_blank"
			>
				<GithubIcon class="*:animate-none!" />
			</Button>
		</div>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
