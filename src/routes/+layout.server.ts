import { buildProfitLossData } from '$lib/server/transform-data/buildProfitLossData';
import { loadHandsFile } from '$lib/server/transform-data/loadHandsFile';
import { loadPlayersFile } from '$lib/server/transform-data/loadPlayersFile';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = async () => {
	const players = await loadPlayersFile();
	const handsFile = await loadHandsFile(
		'./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json'
	);

	const profitLossData = await buildProfitLossData(players, [handsFile]);
	const numHands = Object.values(profitLossData)[0]!.length;

	return { players, profitLossData, numHands };
};
