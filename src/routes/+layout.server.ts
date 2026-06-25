import { buildProfitLossData } from '$lib/server/transform-data/buildProfitLossData';
import { loadHandsFiles } from '$lib/server/transform-data/loadHandsFiles';
import { loadPlayersFile } from '$lib/server/transform-data/loadPlayersFile';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async () => {
	const players = await loadPlayersFile();
	const handsFiles = await loadHandsFiles();

	const sessions = handsFiles
		.sort((a, b) => b.hands[0]!.startedAt.getTime() - a.hands[0]!.startedAt.getTime())
		.map((handsFile, i) => ({
			title: handsFile.hands[0]!.startedAt.toLocaleDateString(),
			url: `/sessions/${i + 1}`
		}));

	const profitLossData = await buildProfitLossData(players, handsFiles);
	const numHands = Object.values(profitLossData)[0]!.length;

	return { players, sessions, profitLossData, numHands };
};
