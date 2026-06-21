<script lang="ts">
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Axis, Chart as LayerChart, Spline, Svg } from 'layerchart';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	type Point = (typeof data.profitLossData)[number][number];

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

		for (const spline of splines) {
			const firstPt = spline[0]!;
			const lastPt = spline[spline.length - 1]!;
			const firstIdx = points.findIndex((p) => p.handNumber === firstPt.handNumber);
			const lastIdx = points.findIndex((p) => p.handNumber === lastPt.handNumber);

			if (firstIdx > 0 && points[firstIdx - 1]!.played !== played) {
				spline.unshift(points[firstIdx - 1]!);
			}
			if (lastIdx < points.length - 1 && points[lastIdx + 1]!.played !== played) {
				spline.push(points[lastIdx + 1]!);
			}
		}

		return splines;
	}

	const allPoints = $derived(data.profitLossData[1]!);

	const playingSplines = $derived(buildSplines(allPoints, true));
	const notPlayingSplines = $derived(buildSplines(allPoints, false));

	$inspect(playingSplines, notPlayingSplines);
</script>

<Chart.Container config={chartConfig} class="min-h-[200px] w-full">
	<LayerChart x="handNumber" y="value">
		<Svg>
			<Axis placement="bottom" format="integer" />
			<Axis placement="left" />

			{#each notPlayingSplines as spline (spline[0]!.handNumber)}
				<Spline data={spline} stroke="red" strokeWidth={2} stroke-dasharray="4 4" opacity={0.2} />
			{/each}

			{#each playingSplines as spline (spline[0]!.handNumber)}
				<Spline data={spline} stroke="red" strokeWidth={2} />
			{/each}
		</Svg>
	</LayerChart>
</Chart.Container>
