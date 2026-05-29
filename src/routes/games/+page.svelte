<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import * as Table from '$lib/components/ui/table/index.js';

	let games = $derived($page.data.games);
</script>

<h1 class="mb-6 text-2xl font-bold">Games</h1>

<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head>Date</Table.Head>
			<Table.Head>Game ID</Table.Head>
			<Table.Head class="text-right">Hands</Table.Head>
			<Table.Head class="text-right">Players</Table.Head>
			<Table.Head class="text-right">Biggest Pot</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each games as game (game.game.gameId)}
			<Table.Row>
				<Table.Cell>
					<a href={resolve('/games/' + game.game.gameId)} class="text-blue-600 hover:underline">
						{new Date(game.startTime).toLocaleDateString()}
					</a>
				</Table.Cell>
				<Table.Cell>
					<a href={resolve('/games/' + game.game.gameId)} class="text-blue-600 hover:underline">
						{game.game.gameId.slice(0, 16)}...
					</a>
				</Table.Cell>
				<Table.Cell class="text-right">{game.totalHands}</Table.Cell>
				<Table.Cell class="text-right">{game.game.hands[0]?.players.length ?? 0}</Table.Cell>
				<Table.Cell class="text-right">
					{Math.max(...game.handStats.map((h) => h.biggestPot), 0)}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>
