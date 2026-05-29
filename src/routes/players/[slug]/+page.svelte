<script lang="ts">
	import { LineChart } from 'layerchart';
	import { ChartContainer, ChartTooltip, type ChartConfig } from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	let { data } = $props();

	let identity = $derived(data.identity);
	let player = $derived(data.playerResult);
	let timeline = $derived(data.timeline);

	let winRate = $derived(player ? Math.round((player.handsWon / player.handsPlayed) * 100) : 0);

	let chartConfig = $derived<ChartConfig>({
		[identity.displayName]: { label: identity.displayName, color: identity.color }
	});

	let chartData = $derived(
		timeline.map((point) => ({
			session: new Date(point.x as number).toLocaleDateString(),
			[identity.displayName]: point.y
		}))
	);

	let series = $derived([
		{
			key: identity.displayName,
			label: identity.displayName,
			value: identity.displayName,
			color: identity.color
		}
	]);
</script>

<h1 class="mb-6 text-2xl font-bold" style="color: {identity.color}">{identity.displayName}</h1>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Total Sessions</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{player?.gamesPlayed ?? 0}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Total Hands</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{player?.handsPlayed ?? 0}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Total P&amp;L</Card.Title>
		</Card.Header>
		<Card.Content>
			<p
				class="text-3xl font-bold {(player?.totalPnl ?? 0) >= 0
					? 'text-green-600'
					: 'text-red-600'}"
			>
				{player ? (player.totalPnl > 0 ? '+' : '') + player.totalPnl : '0'}
			</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Biggest Win</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold text-green-600">{player?.biggestWin ?? 0}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Biggest Loss</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold text-red-600">{player?.biggestLoss ?? 0}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Win Rate</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{winRate}%</p>
		</Card.Content>
	</Card.Root>
</div>

<div class="mb-6">
	<h2 class="mb-3 text-lg font-semibold">Cumulative P&amp;L Over Time</h2>
	<ChartContainer config={chartConfig} class="aspect-auto h-80 w-full">
		<LineChart data={chartData} {series} x="session">
			{#snippet tooltip()}
				<ChartTooltip />
			{/snippet}
		</LineChart>
	</ChartContainer>
</div>

<div>
	<h2 class="mb-3 text-lg font-semibold">Session Breakdown</h2>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Date</Table.Head>
				<Table.Head class="text-right">Hands Played</Table.Head>
				<Table.Head class="text-right">P&amp;L</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each player?.sessionResults ?? [] as session (session.gameId)}
				<Table.Row>
					<Table.Cell>{new Date(session.gameDate).toLocaleDateString()}</Table.Cell>
					<Table.Cell class="text-right">{session.handsPlayed}</Table.Cell>
					<Table.Cell
						class="text-right font-mono {session.pnl >= 0 ? 'text-green-600' : 'text-red-600'}"
					>
						{session.pnl > 0 ? '+' : ''}{session.pnl}
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
