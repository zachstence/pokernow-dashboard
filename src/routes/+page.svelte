<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Chart as LayerChart, Spline, Svg } from 'layerchart';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	type Point = (typeof data.profitLossData)[number][number];

	const chartConfig = $derived(
		Object.fromEntries(
			data.players.map((p) => [p.displayName, { label: p.displayName, color: p.color }])
		) satisfies Chart.ChartConfig
	);

	function buildSplines(points: Point[], played: boolean): Point[][] {
		const splines = points.reduce<Point[][]>((acc, point) => {
			if (point.played !== played) return acc;

			const lastSpline = acc[acc.length - 1];
			if (!lastSpline) {
				acc.push([point]);
				return acc;
			}

			const lastPoint = lastSpline[lastSpline.length - 1]!;
			if (point.handNumber === lastPoint.handNumber + 1) {
				lastSpline.push(point);
				return acc;
			}

			acc.push([point]);
			return acc;
		}, []);

		// Connect each spline group back to the preceding hand to ensure continuous lines
		for (const spline of splines) {
			const firstPt = spline[0]!;
			const firstIdx = points.findIndex((p) => p.handNumber === firstPt.handNumber);

			if (firstIdx > 0) {
				spline.unshift(points[firstIdx - 1]!);
			}
		}

		return splines;
	}

	type PlayerSplines = {
		player: (typeof data.players)[number];
		playingSplines: Point[][];
		notPlayingSplines: Point[][];
	};

	const playerSplines = $derived(
		data.players.map(
			(player): PlayerSplines => ({
				player,
				playingSplines: buildSplines(data.profitLossData[player.id]!, true),
				notPlayingSplines: buildSplines(data.profitLossData[player.id]!, false)
			})
		)
	);
</script>

<Chart.Container config={chartConfig} class="min-h-[200px] w-full">
	<LayerChart x="handNumber" y="value">
		<Svg>
			<Axis placement="bottom" format="integer" />
			<Axis placement="left" />

			{#each playerSplines as { player, notPlayingSplines } (player.id)}
				{#each notPlayingSplines as spline (spline[0]!.handNumber)}
					<Spline
						data={spline}
						stroke={player.color}
						strokeWidth={2}
						stroke-dasharray="4 4"
						opacity={0.4}
					/>
				{/each}
			{/each}

			{#each playerSplines as { player, playingSplines } (player.id)}
				{#each playingSplines as spline (spline[0]!.handNumber)}
					<Spline data={spline} stroke={player.color} strokeWidth={2} />
				{/each}
			{/each}
		</Svg>
	</LayerChart>
</Chart.Container>
