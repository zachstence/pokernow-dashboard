import type {
	GameWithStats,
	PlayerResult,
	PlayerIdentity,
	PlayerCumulativePoint
} from '$lib/data/types.js';

declare global {
	namespace App {
		interface PageData {
			games: GameWithStats[];
			identities: PlayerIdentity[];
			aggregateStats: Record<string, PlayerResult>;
			playerTimelines: PlayerCumulativePoint[];
		}
	}
}

export {};
