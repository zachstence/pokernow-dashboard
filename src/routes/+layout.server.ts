import { loadAllReplays } from '$lib/server/replay-loader.js';
import { getPlayerIdentities } from '$lib/server/players.js';
import {
	computeGameStats,
	computeAggregateStats,
	buildAllPlayerTimelines
} from '$lib/data/stats.js';

export function load() {
	const replays = loadAllReplays();
	const identities = getPlayerIdentities();
	const games = replays.map(computeGameStats);
	const aggregateStats = computeAggregateStats(games, identities);
	const playerTimelines = buildAllPlayerTimelines(games, identities);

	return {
		games,
		identities,
		aggregateStats: Object.fromEntries(aggregateStats),
		playerTimelines
	};
}
