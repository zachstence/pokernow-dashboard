<script lang="ts">
	import {
		type ColumnDef,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type SortingState
	} from '@tanstack/table-core';
	import { createSvelteTable, FlexRender, renderComponent } from '$lib/components/ui/data-table';
	import * as Table from '$lib/components/ui/table';
	import type { PlayersFile } from '$lib/server/transform-data/loadPlayersFile';
	import PlayerNameAndColor from './ui/PlayerNameAndColor.svelte';
	import type { PlayerStats } from '$lib/server/transform-data';
	import SortableDataTableHeader from './SortableDataTableHeader.svelte';

	type Props = {
		players: PlayersFile;
		playerStats: { [playerId: number]: PlayerStats };
		profitByPlayer: { [playerId: number]: number };
	};
	let { players, playerStats, profitByPlayer }: Props = $props();

	type Row = {
		player: {
			displayName: string;
			color: string;
		};
		profit: number;
	} & PlayerStats;

	const data: Row[] = $derived(
		players.map((player) => {
			const stats = playerStats[player.id]!;
			const profit = profitByPlayer[player.id]!;
			return {
				...stats,
				profit,
				player: {
					displayName: player.displayName,
					color: player.color
				}
			};
		})
	);

	let sorting: SortingState = $state([{ id: 'profit', desc: true }]);

	const findSortDirection = (sorting: SortingState, id: string): 'asc' | 'desc' | undefined => {
		const found = sorting.find((s) => s.id === id);
		if (!found) return undefined;
		if (found.desc) return 'desc';
		return 'asc';
	};

	const columns: ColumnDef<Row>[] = [
		{
			accessorKey: 'player',
			header: 'Player',
			cell: ({ row }) => renderComponent(PlayerNameAndColor, { player: row.original.player })
		},
		{
			accessorKey: 'sessionsPlayed',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'Sessions',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'sessionsPlayed')
				})
		},
		{
			accessorKey: 'handsPlayed',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'Hands',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'handsPlayed')
				})
		},
		{
			accessorKey: 'profit',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'Profit/Loss',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'profit')
				}),
			cell: ({
				row: {
					original: { profit }
				}
			}) => (profit >= 0 ? `+$${profit.toFixed(2)}` : `-$${Math.abs(profit).toFixed(2)}`)
		},
		{
			accessorKey: 'vpip',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'VPIP',
					info: 'Voluntarily Put in Pot: How frequently a player voluntarily puts money into the pot by calling or raising preflop. Does not include posting blinds.',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'vpip')
				}),
			cell: ({ row }) => `${(100 * row.original.vpip).toFixed(0)}%`
		},
		{
			accessorKey: 'pfr',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'PFR',
					info: 'Preflop Raise: How frequently a player raises preflop. Includes all preflop raises - open raises, 3-bets, 4-bets, etc.',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'pfr')
				}),
			cell: ({ row }) => `${(100 * row.original.pfr).toFixed(0)}%`
		},
		{
			accessorKey: 'threeBet',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: '3-bet',
					info: "3-bet: How frequently a player re-raises another player's preflop open raise (e.g. Alice posts the $2 big blind, Bob open raises to $5, and Charlie 3-bets to $15).",
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'threeBet')
				}),
			cell: ({ row }) => `${(100 * row.original.threeBet).toFixed(0)}%`
		},
		{
			accessorKey: 'aggFactor',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'AF',
					info: 'Aggression Factor: How many times a player bet or raised postflop divided by how many times they called postflop.',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'aggFactor')
				}),
			cell: ({ row }) => `${row.original.aggFactor.toFixed(2)}`
		},
		{
			accessorKey: 'wtsd',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'WTSD',
					info: 'Went to Showdown: How frequently a player made it to showdown after seeing the flop (e.g. A player who sees 20 flops and makes it to showdown 10 times has 50% WTSD).',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'wtsd')
				}),
			cell: ({ row }) => `${(100 * row.original.wtsd).toFixed(0)}%`
		},
		{
			accessorKey: 'wsd',
			header: ({ column }) =>
				renderComponent(SortableDataTableHeader, {
					label: 'WSD',
					info: 'Won Showdown: How frequently a player wins a showdown that they reach (e.g. A player who makes it to showdown 10 times and wins 4 times has 40% WSD).',
					onclick: column.getToggleSortingHandler(),
					direction: findSortDirection(sorting, 'wsd')
				}),
			cell: ({ row }) => `${(100 * row.original.wsd).toFixed(0)}%`
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
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				sorting = updater(sorting);
			} else {
				sorting = updater;
			}
		},
		state: {
			get sorting() {
				return sorting;
			}
		}
	});
</script>

<div class="col-span-12">
	<div class="rounded-md border">
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
</div>
