<script lang="ts">
	import { LineChart } from 'layerchart';
	import { ChartContainer, ChartTooltip, type ChartConfig } from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();

	let gameStats = $derived(data.gameStats);
	let identities = $derived(data.identities);
	let chipProgression = $derived(data.chipProgression);
	let game = $derived(gameStats.game);
	let firstHand = $derived(game.hands[0]);

	let chartConfig = $derived<ChartConfig>(
		Object.fromEntries(
			identities.map((identity) => [
				identity.displayName,
				{ label: identity.displayName, color: identity.color }
			])
		)
	);

	let chipData = $derived.by(() => {
		const maxPoints = Math.max(...chipProgression.map((p) => p.points.length));
		const result: Record<string, string | number>[] = [];
		for (let i = 0; i < maxPoints; i++) {
			const row: Record<string, string | number> = { hand: `Hand ${i + 1}` };
			for (const progression of chipProgression) {
				row[progression.playerName] = progression.points[i]?.y ?? 0;
			}
			result.push(row);
		}
		return result;
	});

	let series = $derived(
		identities.map((identity) => ({
			key: identity.displayName,
			label: identity.displayName,
			value: identity.displayName,
			color: identity.color
		}))
	);
</script>

<h1 class="mb-6 text-2xl font-bold">Game Details</h1>

<div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Date</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-lg font-semibold">
				{firstHand ? new Date(firstHand.startedAt).toLocaleDateString() : '—'}
			</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Game ID</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="font-mono text-sm">{game.gameId}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Blinds</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-lg font-semibold">
				{firstHand ? `${firstHand.smallBlind}/${firstHand.bigBlind}` : '—'}
			</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Starting Stacks</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-lg font-semibold">
				{firstHand ? firstHand.players.map((p) => `${p.name}: ${p.stack}`).join(', ') : '—'}
			</p>
		</Card.Content>
	</Card.Root>
</div>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
	{#each identities as identity (identity.playerIds[0])}
		{@const pnl = gameStats.handStats.reduce((sum, h) => {
			const ps = h.playerStats.get(identity.playerIds[0]);
			return sum + (ps?.net ?? 0);
		}, 0)}
		<Card.Root>
			<Card.Header>
				<Card.Title>{identity.displayName}</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-2xl font-bold {pnl >= 0 ? 'text-green-600' : 'text-red-600'}">
					{pnl > 0 ? '+' : ''}{pnl}
				</p>
			</Card.Content>
		</Card.Root>
	{/each}
</div>

<div>
	<h2 class="mb-3 text-lg font-semibold">Chip Stack Progression</h2>
	<ChartContainer config={chartConfig} class="aspect-auto h-80 w-full">
		<LineChart data={chipData} {series} x="hand">
			{#snippet tooltip()}
				<ChartTooltip />
			{/snippet}
		</LineChart>
	</ChartContainer>
</div>
