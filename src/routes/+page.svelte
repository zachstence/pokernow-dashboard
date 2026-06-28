<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import {
		Axis,
		ChartClipPath,
		Circle,
		Frame,
		Grid,
		Highlight,
		Chart as LayerChart,
		Legend,
		Spline,
		Svg,
		Tooltip,
		type ChartState,
		type HighlightPointData,
		type LegendItem
	} from 'layerchart';
	import type { PageProps } from './$types';
	import * as Card from '$lib/components/ui/card';
	import Value from '$lib/components/Value.svelte';
	import ProfitLossTable from '$lib/components/PlayerTable.svelte';
	import { createRawSnippet } from 'svelte';
	import * as ShadTooltip from '$lib/components/ui/tooltip';
	import { scaleOrdinal } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';

	const { data: pageData }: PageProps = $props();

	let chartContext: ChartState | undefined = $state();

	const chartConfig = $derived(
		Object.fromEntries(
			pageData.players.map((p) => [p.id.toString(), { label: p.displayName, color: p.color }])
		) satisfies Chart.ChartConfig
	);

	const chartData = $derived([
		pageData.players.reduce<Record<string, unknown>>((acc, player) => {
			acc[player.id] = 0;
			acc[`${player.id}_played`] = true;
			acc.handNumber = 0;
			return acc;
		}, {}),
		...Array.from({ length: pageData.overview.totalHandsPlayed }, (_, i) => {
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
	]);

	const profitByPlayer = $derived(
		Object.fromEntries(
			Object.entries(pageData.overview.profitLossData).map(([playerId, playerData]) => [
				parseInt(playerId),
				playerData[playerData.length - 1]!.value
			])
		)
	);

	// y ticks
	const Y_TICK_INTERVAL = 10;
	const yTicks = $derived.by(() => {
		if (!chartContext) return [];
		const [min, max] = chartContext.yDomain;
		const numPositiveTicks = Math.floor(max / Y_TICK_INTERVAL);
		const positiveTicks = Array.from({ length: numPositiveTicks }).map(
			(_, i) => Y_TICK_INTERVAL * (i + 1)
		);
		const numNegativeTicks = Math.floor(Math.abs(min) / Y_TICK_INTERVAL);
		const negativeTicks = Array.from({ length: numNegativeTicks }).map(
			(_, i) => -1 * Y_TICK_INTERVAL * (i + 1)
		);
		return [0, ...positiveTicks, ...negativeTicks];
	});

	let legendSelected: number[] = $state([]);
	const onLegendClick = (_: unknown, d: LegendItem) => {
		if (!chartContext) return;
		const clickedIndex = legendSelected.findIndex((id) => id === d.value);
		if (clickedIndex === -1) {
			legendSelected.push(d.value);
		} else {
			legendSelected.splice(clickedIndex, 1);
		}
	};
	const onLegendHoverEnter = (_: unknown, d: LegendItem) => {
		if (!chartContext) return;
		chartContext.series.highlightKey = d.value.toString();
	};
	const onLegendHoverLeave = (_: unknown, d: LegendItem) => {
		if (!chartContext) return;
		chartContext.series.highlightKey = null;
	};

	$inspect('legendSelected', legendSelected);
	$inspect('highlightKey', chartContext?.series.highlightKey);
</script>

<div class="grid grid-cols-12 gap-4 p-4">
	<Card.Root class="col-span-3">
		<Card.Header>
			<Card.Title>Total Sessions Played</Card.Title>
		</Card.Header>
		<Card.Content>
			<Value class="text-center" value={pageData.overview.totalSessionsPlayed} />
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

	<Card.Root class="col-span-12">
		<Card.Header>
			<Card.Title>Player Stats</Card.Title>
		</Card.Header>
		<Card.Content>
			<ProfitLossTable
				players={pageData.players}
				playerStats={pageData.playerStats}
				{profitByPlayer}
			/>
		</Card.Content>
	</Card.Root>

	<Card.Root class="col-span-12 w-full">
		<Card.Header>
			<Card.Title>Profit and Loss by Hand</Card.Title>
		</Card.Header>
		<Card.Content>
			<Legend
				selected={legendSelected as unknown as string[]}
				scale={scaleOrdinal(
					pageData.players.map((p) => p.id),
					pageData.players.map((p) => p.color)
				)}
				tickFormat={(value) => pageData.players.find((p) => p.id === value)!.displayName}
				variant="swatches"
				onclick={onLegendClick}
				onpointerenter={onLegendHoverEnter}
				onpointerleave={onLegendHoverLeave}
				classes={{
					item: 'p-1 -m-1 hover:opacity-100! hover:bg-muted transition-all rounded-sm',
					swatch: 'rounded-sm'
				}}
			/>

			<Chart.Container config={chartConfig} class="aspect-auto">
				<LayerChart
					bind:context={chartContext}
					data={chartData}
					series={pageData.players.map((p) => ({ key: p.id.toString(), color: p.color }))}
					x="handNumber"
					xDomain={[0, pageData.overview.totalHandsPlayed]}
					tooltipContext={{ mode: 'quadtree-x' }}
					padding={20}
					yNice
					height={400}
				>
					<Svg>
						<Axis
							placement="bottom"
							ticks={(scale) => {
								const defaultTicks = scale.ticks?.();
								if (!defaultTicks) return [];
								return [1, ...defaultTicks.filter((t) => t !== 0)];
							}}
						/>
						<Axis placement="left" format={(v) => (v >= 0 ? `+$${v}` : `-$${Math.abs(v)}`)} />
						<Grid y {yTicks} />
						<Frame class="fill-none stroke-border/50 stroke-1" />

						<ChartClipPath
							initialWidth={0}
							motion={{ width: { type: 'tween', duration: 1000, easing: cubicInOut } }}
						>
							{#each pageData.players as player (player.id)}
								{@const pIdStr = player.id.toString()}
								{@const dim =
									chartContext &&
									chartContext.series.highlightKey &&
									chartContext.series.highlightKey !== pIdStr}
								{@const highlighted = chartContext && chartContext.series.highlightKey === pIdStr}
								{@const hidden =
									!highlighted &&
									legendSelected.length &&
									!legendSelected.includes(parseInt(pIdStr))}

								<Spline
									y={pIdStr}
									defined={(
										d: { [x: string]: boolean },
										i: number,
										arr: { [x: string]: { [x: string]: boolean } }
									) => {
										if (d[pIdStr] === undefined) return false;
										const didntPlayNow = d[`${pIdStr}_played`] === false;
										const didntPlayNext = arr[i + 1]?.[`${pIdStr}_played`] === false;
										return didntPlayNow || didntPlayNext;
									}}
									stroke={player.color}
									strokeWidth={1.5}
									stroke-dasharray="4 4"
									class={hidden ? 'opacity-0' : dim ? 'opacity-10 saturate-0' : 'opacity-30'}
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
									class="transition-opacity {hidden
										? 'opacity-0'
										: dim
											? 'opacity-15 saturate-0'
											: ''}"
								/>
							{/each}
						</ChartClipPath>

						<Highlight lines>
							{#snippet points({ points })}
								{#each points as point}
									{@const pIdStr = (point as unknown as { seriesKey: string }).seriesKey}
									{@const dim =
										chartContext &&
										chartContext.series.highlightKey &&
										chartContext.series.highlightKey !== pIdStr}
									{@const highlighted = chartContext && chartContext.series.highlightKey === pIdStr}
									{@const hidden =
										!highlighted &&
										legendSelected.length &&
										!legendSelected.includes(parseInt(pIdStr))}

									<Circle
										cx={point.x}
										cy={point.y}
										r={4}
										fill={point.fill}
										class="transition-opacity {hidden ? 'opacity-0' : dim ? 'opacity-0' : ''}"
										onmouseenter={() => {
											chartContext!.series.highlightKey = pIdStr;
										}}
										onmouseleave={() => {
											chartContext!.series.highlightKey = null;
										}}
									/>
								{/each}
							{/snippet}
						</Highlight>
					</Svg>

					<Tooltip.Root variant="none" class="pointer-events-none z-50">
						{#snippet children({ data })}
							{#if data && data.handNumber !== 0}
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
												return { id: pIdStr, name: p.displayName, color: p.color, value: data[pIdStr] as number | undefined, played: data[`${pIdStr}_played`] as boolean | undefined };
											})
											.filter((item) => item.value !== undefined)
											.sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as item (item.name)}
											{@const active = chartContext?.series.highlightKey === item.id}
											<div
												class="-my-0.px -mx-1 flex items-center justify-between gap-4 rounded-sm px-1 py-px transition-all duration-150"
												class:opacity-40={!item.played}
												class:bg-muted={active}
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
		</Card.Content>
	</Card.Root>
</div>
