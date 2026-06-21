import type { PlayerId, PlayersFile } from './loadPlayersFile';

const map: Record<string, PlayerId> = {};

export const pokerNowPlayerIdToPlayerId = (
	players: PlayersFile,
	pokerNowPlayerId: string
): PlayerId => {
	if (pokerNowPlayerId in map) {
		return map[pokerNowPlayerId]!;
	}

	const player = players.find((p) => p.pokerNowPlayerIds.includes(pokerNowPlayerId));
	if (!player) {
		throw new Error(`Failed to find playerId for pokerNowPlayerId ${pokerNowPlayerId}`);
	}
	const playerId = player.id;

	map[pokerNowPlayerId] = playerId;
	return playerId;
};
