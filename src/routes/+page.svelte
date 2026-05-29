<script lang="ts">
	import { page } from '$app/stores';
	import {
		LineChart,
		getChartContext,
		type AnnotationLineProps,
		type ChartAnnotations
	} from 'layerchart';
	import { ChartContainer, ChartTooltip, type ChartConfig } from '$lib/components/ui/chart';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	let totalSessions = $derived($page.data.games.length);
	let totalHands = $derived($page.data.games.reduce((sum: number, g) => sum + g.totalHands, 0));
	let uniquePlayers = $derived($page.data.identities.length);
	let biggestPot = $derived(
		Math.max(...$page.data.games.flatMap((g) => g.handStats.map((h) => h.biggestPot)), 0)
	);

	let standings = $derived(
		Object.values($page.data.aggregateStats).sort((a, b) => b.totalPnl - a.totalPnl)
	);

	let chartConfig = $derived<ChartConfig>(
		Object.fromEntries(
			$page.data.identities.map((identity) => [
				identity.displayName,
				{ label: identity.displayName, color: identity.color }
			])
		)
	);

	let chartData = $derived.by(() => {
		const timelines = $page.data.playerTimelines;
		if (timelines.length === 0) return [];
		const maxPoints = Math.max(...timelines.map((p) => p.points.length));
		const result: Record<string, unknown>[] = [];
		for (let i = 0; i < maxPoints; i++) {
			const point = timelines.find((t) => t.points[i] !== undefined)?.points[i];
			const row: Record<string, unknown> = {
				hand: i + 1,
				gameDate: point?.gameDate ?? '',
				handNumberWithinGame: point?.handNumberWithinGame ?? ''
			};
			for (const timeline of timelines) {
				row[timeline.playerName] = timeline.points[i]?.y ?? 0;
			}
			result.push(row);
		}
		return result;
	});

	function formatHandLabel(value: unknown) {
		const ctx = getChartContext();
		const data = ctx.tooltip.data as Record<string, unknown> | undefined;
		if (data?.gameDate && data?.handNumberWithinGame) {
			return `${new Date(data.gameDate as number).toLocaleDateString()} - Hand ${data.handNumberWithinGame}`;
		}
		return `${value}`;
	}

	let series = $derived(
		$page.data.identities.map((identity) => ({
			key: identity.displayName,
			label: identity.displayName,
			value: identity.displayName,
			color: identity.color
		}))
	);

	let gameAnnotations = $derived.by(() => {
		const sorted = [...$page.data.games].sort((a, b) => a.startTime - b.startTime);
		let handIndex = 1;
		return sorted.map((game) => {
			const annotation: AnnotationLineProps = {
				type: 'line' as const,
				x: handIndex,
				label: new Date(game.startTime).toLocaleDateString(),
				labelPlacement: 'top-right' as const,
				labelXOffset: 4,
				props: {
					line: {
						class: 'stroke-muted-foreground/15!',
						'stroke-dasharray': '4 4'
					},
					label: {
						class: 'fill-muted-foreground/40!'
					}
				}
			};
			handIndex += game.totalHands;
			return annotation;
		});
	});
</script>

<h1 class="mb-6 text-2xl font-bold">Dashboard</h1>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Total Sessions</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{totalSessions}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Total Hands</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{totalHands}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Players</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{uniquePlayers}</p>
		</Card.Content>
	</Card.Root>
	<Card.Root>
		<Card.Header>
			<Card.Title>Biggest Pot</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-3xl font-bold">{biggestPot}</p>
		</Card.Content>
	</Card.Root>
</div>

<div class="mb-6">
	<h2 class="mb-3 text-lg font-semibold">Player Standings</h2>
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Player</Table.Head>
				<Table.Head>Games</Table.Head>
				<Table.Head>Hands</Table.Head>
				<Table.Head class="text-right">Total P&amp;L</Table.Head>
				<Table.Head class="text-right">Biggest Win</Table.Head>
				<Table.Head class="text-right">Biggest Loss</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each standings as player (player.playerId)}
				<Table.Row>
					<Table.Cell class="font-medium">
						<span class="inline-block size-3 rounded-full" style="background: {player.color}"
						></span>
						{player.displayName}
					</Table.Cell>
					<Table.Cell>{player.gamesPlayed}</Table.Cell>
					<Table.Cell>{player.handsPlayed}</Table.Cell>
					<Table.Cell
						class="text-right font-mono {player.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}"
						>{player.totalPnl > 0 ? '+' : ''}{player.totalPnl}</Table.Cell
					>
					<Table.Cell class="text-right font-mono text-green-600">{player.biggestWin}</Table.Cell>
					<Table.Cell class="text-right font-mono text-red-600">{player.biggestLoss}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>

<div>
	<h2 class="mb-3 text-lg font-semibold">Cumulative Profit Over Time</h2>
	<ChartContainer config={chartConfig} class="aspect-auto h-80 w-full">
		<LineChart
			data={chartData}
			{series}
			x="hand"
			annotations={gameAnnotations}
			props={{ xAxis: { tickLabelProps: { style: 'display: none' } } }}
		>
			{#snippet tooltip()}
				<ChartTooltip labelFormatter={formatHandLabel} />
			{/snippet}
		</LineChart>
	</ChartContainer>
</div>
