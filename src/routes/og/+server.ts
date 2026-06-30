import { computeStats } from '$lib/server/transform-data';
import type { RequestHandler } from './$types';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { dirname, join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';

// Satori doesn't support WOFF2 or variable fonts, so we need to use @fontsource/inter here while the rest of the app uses @fontsource-variable/inter
const fontSourceDir = join(
	dirname(import.meta.resolve('@fontsource/inter/package.json')),
	'files'
).replace(/^file:/, '');
console.log(fontSourceDir);

const regex = /^inter-latin-(\d\d\d)-(normal|italic).woff$/;
const fontFiles = await readdir(fontSourceDir);
const fonts = (
	await Promise.all(
		fontFiles.map(async (filename) => {
			const match = filename.match(regex) as [string, string, string] | null;
			if (!match) return undefined;

			const weight = parseInt(match[1]) as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
			const style = match[2] as 'normal' | 'italic';
			const data = await readFile(join(fontSourceDir, filename));

			return { name: 'Inter', data, weight, style };
		})
	)
).filter((x): x is NonNullable<typeof x> => x !== undefined);
export const GET: RequestHandler = async () => {
	const stats = await computeStats();

	const numHands = stats.overview.totalHandsPlayed;

	const svg = await satori(
		{
			type: 'div',
			props: {
				children: `${numHands}`,
				style: { color: 'black' }
			}
		},
		{
			width: 1200,
			height: 630,
			fonts
		}
	);

	const png = new Resvg(svg).render().asPng();

	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png'
		}
	});
};
