<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Chart as LayerChart, Spline, Svg } from 'layerchart';

	// every player series needs to start with a 0 and end with their current balance so the graph is fully connected (either dotted or solid) all the way through

	const data: Record<string, { x: number; value: number | null }[]> = {
		player1: [
			{ x: 1, value: 0 },
			{ x: 2, value: 0 },
			{ x: 3, value: 75 },
			{ x: 5, value: 75 },
			{ x: 6, value: 120 }
		],
		player2: [
			{ x: 1, value: 0 },
			{ x: 2, value: 50 },
			{ x: 3, value: 60 },
			{ x: 6, value: 60 }
		],
		player3: [
			{ x: 1, value: 0 },
			{ x: 2, value: -50 },
			{ x: 3, value: -35 },
			{ x: 4, value: -10 },
			{ x: 5, value: -20 },
			{ x: 6, value: 20 }
		],
		player4: [
			{ x: 1, value: 0 },
			{ x: 3, value: 0 },
			{ x: 5, value: 0 },
			{ x: 6, value: -45 }
		]
	};

	const colors: Record<string, string> = {
		player1: 'red',
		player2: 'orange',
		player3: 'green',
		player4: 'blue'
	};

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
	<LayerChart x="x" y="value">
		<Svg>
			<Axis placement="bottom" format="integer" />
			<Axis placement="left" />

			{#each Object.entries(data) as [playerId, points]}
				{#each points as point, p}
					{@const prevPoint = points[p - 1]}

					{#if prevPoint}
						{@const isGap = point.x - prevPoint.x > 1}

						<Spline
							data={[prevPoint, point]}
							// curve={curveLinear}
							stroke={colors[playerId]}
							strokeWidth={2}
							stroke-dasharray={isGap ? '4 4' : undefined}
						/>
					{/if}
				{/each}
			{/each}
		</Svg>
	</LayerChart>
</Chart.Container>
