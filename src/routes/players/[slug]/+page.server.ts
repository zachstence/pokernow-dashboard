import { loadAllReplays } from '$lib/server/replay-loader.js';
import { getPlayerIdentities } from '$lib/server/players.js';
import { computeGameStats, computeAggregateStats, buildPlayerTimeline } from '$lib/data/stats.js';

export function entries() {
	const identities = getPlayerIdentities();
	return identities.map((identity) => ({ slug: identity.playerIds[0] }));
}

export function load({ params }) {
	const identities = getPlayerIdentities();
	const identity = identities.find((i) => i.playerIds[0] === params.slug);

	if (!identity) {
		throw new Error(`Player not found: ${params.slug}`);
	}

	const replays = loadAllReplays();
	const games = replays.map(computeGameStats);
	const aggregateStats = computeAggregateStats(games, identities);
	const playerResult = aggregateStats.get(params.slug);
	const timeline = buildPlayerTimeline(games, params.slug);

	return {
		identity,
		playerResult,
		timeline
	};
}
