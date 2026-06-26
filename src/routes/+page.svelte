<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Highlight, Chart as LayerChart, Spline, Svg, Tooltip } from 'layerchart';
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Value from '$lib/components/Value.svelte';
	import ProfitLossTable from '$lib/components/PlayerTable.svelte';

	const { data: pageData }: PageProps = $props();

	const chartConfig = $derived(
		Object.fromEntries(
			pageData.players.map((p) => [p.id.toString(), { label: p.displayName, color: p.color }])
		) satisfies Chart.ChartConfig
	);

	const chartData = $derived(
		Array.from({ length: pageData.overview.totalHandsPlayed }, (_, i) => {
			const row: Record<string, unknown> = { handNumber: i + 1 };

			for (const playerId in pageData.overview.profitLossData) {
				const handData = pageData.overview.profitLossData[playerId]?.[i];
				if (handData) {
					row[playerId] = handData.value;
					row[`${playerId}_played`] = handData.played;
				}
			}
			return row;
		})
	);

	const profitByPlayer = $derived(
		Object.fromEntries(
			Object.entries(pageData.overview.profitLossData).map(([playerId, playerData]) => [
				parseInt(playerId),
				playerData[playerData.length - 1]!.value
			])
		)
	);
</script>

<div class="grid grid-cols-12 gap-2 p-2">
	<Card.Root class="col-span-3">
		<Card.Header>
			<Card.Title>Total Sessions Played</Card.Title>
		</Card.Header>
		<Card.Content>
			<Value class="text-center" value={123456789} />
		</Card.Content>
	</Card.Root>

	<Card.Root class="col-span-3">
		<Card.Header>
			<Card.Title>Total Hands Played</Card.Title>
		</Card.Header>
		<Card.Content>
			<Value class="text-center" value={pageData.overview.totalHandsPlayed} />
		</Card.Content>
	</Card.Root>

	<Card.Root class="col-span-3">
		<Card.Header>
			<Card.Title>Total Players</Card.Title>
		</Card.Header>
		<Card.Content>
			<Value class="text-center" value={pageData.overview.totalPlayers} />
		</Card.Content>
	</Card.Root>

	<Card.Root class="col-span-3">
		<Card.Header>
			<Card.Title>Biggest Pot</Card.Title>
		</Card.Header>
		<Card.Content>
			<Value class="text-center" value={pageData.overview.biggestPot} prefix="$" />
		</Card.Content>
	</Card.Root>

	<ProfitLossTable players={pageData.players} playerStats={pageData.playerStats} {profitByPlayer} />

	<Chart.Container config={chartConfig} class="col-span-12 ml-10 min-h-[350px] w-full">
		<LayerChart
			data={chartData}
			series={pageData.players.map((p) => ({ key: p.id.toString(), color: p.color }))}
			x="handNumber"
			tooltipContext={{ mode: 'quadtree-x' }}
		>
			<Svg>
				<Axis placement="bottom" format="integer" />
				<Axis placement="left" format={(v) => (v >= 0 ? `+$${v}` : `-$${Math.abs(v)}`)} />

				{#each pageData.players as player (player.id)}
					{@const pIdStr = player.id.toString()}

					<Spline
						y={pIdStr}
						defined={(d: { [x: string]: undefined }) => d[pIdStr] !== undefined}
						stroke={player.color}
						strokeWidth={1.5}
						stroke-dasharray="4 4"
						opacity={0.3}
					/>

					<Spline
						y={pIdStr}
						defined={(
							d: { [x: string]: boolean },
							i: number,
							arr: { [x: string]: { [x: string]: boolean } }
						) => {
							if (d[pIdStr] === undefined) return false;
							const playedNow = d[`${pIdStr}_played`] === true;
							// Use the internal array pointer 'arr' safely instead of tracking chartData
							const playedNext = arr[i + 1]?.[`${pIdStr}_played`] === true;
							return playedNow || playedNext;
						}}
						stroke={player.color}
						strokeWidth={2.5}
					/>
				{/each}

				<Highlight lines />
			</Svg>

			<Tooltip.Root variant="none" class="pointer-events-none z-50">
				{#snippet children({ data })}
					{#if data}
						<div
							class="min-w-[140px] rounded-lg border border-border/60 bg-background p-2.5 text-xs shadow-md"
						>
							<div class="mb-1.5 border-b pb-1 font-medium text-muted-foreground">
								Hand #{data.handNumber}
							</div>

							<div class="grid gap-1.5">
								{#each pageData.players
									.map((p) => {
										const pIdStr = p.id.toString();
										return { name: p.displayName, color: p.color, value: data[pIdStr] as number | undefined, played: data[`${pIdStr}_played`] as boolean | undefined };
									})
									.filter((item) => item.value !== undefined)
									.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as item (item.name)}
									<div
										class="flex items-center justify-between gap-4 transition-opacity duration-150"
										class:opacity-40={!item.played}
									>
										<div class="flex items-center gap-1.5">
											<div
												class="h-2 w-2 rounded-full"
												style="background-color: {item.color}"
											></div>
											<span class="font-normal text-foreground">
												{item.name}
												{#if !item.played}
													<span
														class="text-[10px] font-light text-muted-foreground normal-case italic"
														>(out)</span
													>
												{/if}
											</span>
										</div>
										<span class="tracking-tight tabular-nums">
											{item.value! >= 0
												? `+$${item.value!.toFixed(2)}`
												: `-$${Math.abs(item.value!).toFixed(2)}`}
										</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/snippet}
			</Tooltip.Root>
		</LayerChart>
	</Chart.Container>
</div>
