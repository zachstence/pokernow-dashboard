<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Chart as LayerChart, Spline, Svg } from 'layerchart';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	console.log({ data });

	const chartConfig = {
		desktop: {
			label: 'Desktop',
			color: '#2563eb'
		},
		mobile: {
			label: 'Mobile',
			color: '#60a5fa'
		}
	} satisfies Chart.ChartConfig;
</script>

<Chart.Container config={chartConfig} class="min-h-[200px] w-full">
	<LayerChart x="handNumber" y="value">
		<Svg>
			<Axis placement="bottom" format="integer" />
			<Axis placement="left" />

			<!-- {#each Object.entries(data.profitLossData) as [playerId, points]}
				{@const color = data.players.find((p) => p.id === parseInt(playerId))!.color}
				{#each points as point, p}
					{@const prevPoint = points[p - 1]}
					{#if prevPoint && !point.played}
						<Spline
							data={[prevPoint, point]}
							stroke={color}
							strokeWidth={2}
							stroke-dasharray="4 4"
						/>
					{/if}
				{/each}
			{/each} -->

			<!-- {#each Object.entries(data.profitLossData) as [playerId, points]} -->
			<!-- {@const color = data.players.find((p) => p.id === parseInt(playerId))!.color} -->
			{#each data.profitLossData[1] as point, p}
				{@const prevPoint = data.profitLossData[1]![p - 1]}
				{#if prevPoint && point.played}
					<Spline data={[prevPoint, point]} stroke={'red'} strokeWidth={2} />
				{/if}
			{/each}
			<!-- {/each} -->
		</Svg>
	</LayerChart>
</Chart.Container>
