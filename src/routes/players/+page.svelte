<script lang="ts">
	import { page } from '$app/stores';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';

	let standings = $derived(
		Object.values($page.data.aggregateStats).sort((a, b) => b.totalPnl - a.totalPnl)
	);
</script>

<h1 class="mb-6 text-2xl font-bold">Players</h1>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
	{#each standings as player (player.playerId)}
		<a href={'/players/' + player.playerId}>
			<Card.Root class="transition-colors hover:bg-muted/50">
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<span class="inline-block size-3 rounded-full" style="background: {player.color}"></span>
						{player.displayName}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Games</span>
							<span>{player.gamesPlayed}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Hands</span>
							<span>{player.handsPlayed}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">P&amp;L</span>
							<span class="font-mono {player.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}">
								{player.totalPnl > 0 ? '+' : ''}{player.totalPnl}
							</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</a>
	{/each}
</div>

<div>
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
						<a href={'/players/' + player.playerId} class="flex items-center gap-2">
							<span class="inline-block size-3 rounded-full" style="background: {player.color}"></span>
							{player.displayName}
						</a>
					</Table.Cell>
					<Table.Cell>{player.gamesPlayed}</Table.Cell>
					<Table.Cell>{player.handsPlayed}</Table.Cell>
					<Table.Cell
						class="text-right font-mono {player.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}"
					>
						{player.totalPnl > 0 ? '+' : ''}{player.totalPnl}
					</Table.Cell>
					<Table.Cell class="text-right font-mono text-green-600">{player.biggestWin}</Table.Cell>
					<Table.Cell class="text-right font-mono text-red-600">{player.biggestLoss}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
