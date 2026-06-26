<script lang="ts">
	import {
		type ColumnDef,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import type { PlayersFile } from '$lib/server/transform-data/loadPlayersFile';
	import PlayerNameAndColor from './ui/PlayerNameAndColor.svelte';
	import type { PlayerStats } from '$lib/server/transform-data';

	type Props = {
		players: PlayersFile;
		playerStats: { [playerId: number]: PlayerStats };
	};
	let { players, playerStats }: Props = $props();

	type Row = {
		player: {
			displayName: string;
			color: string;
		};
	} & PlayerStats;

	const data: Row[] = $derived(
		players.map((player) => {
			const stats = playerStats[player.id]!;
			return {
				...stats,
				player: {
					displayName: player.displayName,
					color: player.color
				}
			};
		})
	);

	const columns: ColumnDef<Row>[] = [
		{
			accessorKey: 'player',
			header: 'Player',
			cell: ({ row }) => renderComponent(PlayerNameAndColor, { player: row.original.player })
		},
		{
			accessorKey: 'vpip',
			header: 'VPIP',
			cell: ({ row }) => `${(100 * row.original.vpip).toFixed(0)}%`
		},
		{
			accessorKey: 'pfr',
			header: 'PFR',
			cell: ({ row }) => `${(100 * row.original.pfr).toFixed(0)}%`
		},
		{
			accessorKey: 'threeBet',
			header: '3Bet',
			cell: ({ row }) => `${(100 * row.original.threeBet).toFixed(0)}%`
		},
		{
			accessorKey: 'aggFactor',
			header: 'AF',
			cell: ({ row }) => `${row.original.aggFactor.toFixed(2)}`
		}
	];

	const table = createSvelteTable({
		get data() {
			return data;
		},
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel()
	});
</script>

<div class="col-span-12">
	<Table.Root>
		<Table.Header>
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head>
							{#if !header.isPlaceholder}
								<FlexRender
									content={header.column.columnDef.header}
									context={header.getContext()}
								/>
							{/if}
						</Table.Head>
					{/each}
				</Table.Row>
			{/each}
		</Table.Header>
		<Table.Body>
			{#each table.getRowModel().rows as row (row.id)}
				<Table.Row>
					{#each row.getVisibleCells() as cell (cell.id)}
						<Table.Cell>
							<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
