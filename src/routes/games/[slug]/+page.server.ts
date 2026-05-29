import { loadReplayByGameId } from '$lib/server/replay-loader.js';
import { getPlayerIdentities } from '$lib/server/players.js';
import { computeGameStats, buildGameChipProgression } from '$lib/data/stats.js';
import { loadAllReplays } from '$lib/server/replay-loader.js';

export function entries() {
	const replays = loadAllReplays();
	return replays.map((r) => ({ slug: r.gameId }));
}

export function load({ params }) {
	const game = loadReplayByGameId(params.slug);
	if (!game) {
		throw new Error(`Game not found: ${params.slug}`);
	}

	const identities = getPlayerIdentities();
	const gameStats = computeGameStats(game);
	const chipProgression = buildGameChipProgression(gameStats, identities);

	return {
		gameStats,
		identities,
		chipProgression
	};
}
