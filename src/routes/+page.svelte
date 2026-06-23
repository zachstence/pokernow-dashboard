<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Highlight, Chart as LayerChart, Spline, Svg, Tooltip } from 'layerchart';
	import type { PageProps } from './$types';

	const { data: pageData }: PageProps = $props();

	const chartConfig = $derived(
		Object.fromEntries(
			pageData.players.map((p) => [p.id.toString(), { label: p.displayName, color: p.color }])
		) satisfies Chart.ChartConfig
	);

	const chartData = $derived(
		Array.from({ length: pageData.numHands }).reduce<Record<string, unknown>[]>((acc, _, i) => {
			acc[i] = {
				handNumber: i + 1
			};
			Object.keys(pageData.profitLossData).forEach((playerId) => {
				const pid = parseInt(playerId);
				const handData = pageData.profitLossData[pid]?.[i];
				if (handData) {
					acc[i]![playerId] = handData.value;
					// Store the played flag globally keyed by player ID so we can access it during rendering
					acc[i]![`${playerId}_played`] = handData.played;
				}
			});
			return acc;
		}, [])
	);
</script>

<Chart.Container config={chartConfig} class="min-h-[200px] w-full">
	<LayerChart
		data={chartData}
		series={pageData.players.map((p) => ({ key: p.id.toString(), color: p.color }))}
		x="handNumber"
		tooltipContext={{ mode: 'quadtree-x' }}
	>
		<Svg>
			<Axis placement="bottom" format="integer" />
			<Axis placement="left" />

			{#each pageData.players as player (player.id)}
				{@const pIdStr = player.id.toString()}

				<Spline
					y={pIdStr}
					defined={(d) => d[pIdStr] !== undefined}
					stroke={player.color}
					strokeWidth={2}
					stroke-dasharray="4 4"
					opacity={0.4}
				/>

				<Spline
					y={pIdStr}
					defined={(d, i) => {
						const playedNow = d[`${pIdStr}_played`] === true;
						// Look ahead 1 index: if they play on the NEXT hand, this hand's line needs to bridge to it
						const playedNext = chartData[i + 1]?.[`${pIdStr}_played`] === true;

						return d[pIdStr] !== undefined && (playedNow || playedNext);
					}}
					stroke={player.color}
					strokeWidth={2}
				/>
			{/each}

			<Highlight lines />
		</Svg>

		<Tooltip.Root variant="none" class="pointer-events-none z-50">
			{#snippet children({ data })}
				{#if data}
					<div
						class="min-w-[120px] rounded-lg border-border/50 bg-background p-2.5 text-xs shadow-sm"
					>
						<div class="mb-1.5 border-b pb-1 font-medium text-muted-foreground">
							Hand #{data.handNumber}
						</div>

						<div class="grid gap-1">
							{#each pageData.players
								.map( (p) => ({ name: p.displayName, color: p.color, value: data[p.id.toString()] as number | undefined, played: data[`${p.id}_played`] as boolean | undefined }) )
								// Filter out any players who haven't populated a data coordinate here yet
								.filter((item) => item.value !== undefined)
								// SORT: Descending order (Highest profit down to biggest loss)
								.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as item (item.name)}
								<div
									class="flex items-center justify-between gap-4"
									class:opacity-50={!item.played}
								>
									<div class="flex items-center gap-1.5">
										<div class="h-2 w-2 rounded-full" style="background-color: {item.color}"></div>
										<span class="font-normal text-muted-foreground">
											{item.name}
											{#if !item.played}
												<span class="text-[10px] text-muted-foreground/70 italic">(out)</span>
											{/if}
										</span>
									</div>
									<span class="font-mono font-medium tracking-tight">
										{item.value !== undefined
											? item.value >= 0
												? `+$${item.value}`
												: `-$${Math.abs(item.value).toFixed(2)}`
											: '0'}
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
