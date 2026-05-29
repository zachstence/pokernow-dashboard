import type {
	Hand,
	HandEvent,
	HandWithStats,
	GameWithStats,
	PlayerResult,
	PlayerCumulativePoint,
	ChartPoint,
	PlayerIdentity,
	ReplayFile
} from '$lib/data/types.js';

function isMoneyEvent(event: HandEvent): boolean {
	const t = event.payload.type;
	return t === 2 || t === 3 || t === 7 || t === 8 || t === 10 || t === 16;
}

function isCommitEvent(event: HandEvent): boolean {
	const t = event.payload.type;
	return t === 2 || t === 3 || t === 7 || t === 8;
}

function computeHandPlayerStats(hand: Hand): Map<string, HandPlayerStats> {
	const statsMap = new Map<string, HandPlayerStats>();

	for (const player of hand.players) {
		statsMap.set(player.id, {
			playerId: player.id,
			playerName: player.name,
			startingStack: player.stack,
			committed: 0,
			refunded: 0,
			won: 0,
			net: 0,
			endingStack: player.stack
		});
	}

	for (const event of hand.events) {
		if (!isMoneyEvent(event)) continue;

		const payload = event.payload;
		const seat = 'seat' in payload ? (payload as { seat: number }).seat : undefined;
		if (seat === undefined) continue;

		const player = hand.players.find((p) => p.seat === seat);
		if (!player) continue;

		const stats = statsMap.get(player.id);
		if (!stats) continue;

		if (isCommitEvent(event)) {
			if ('allIn' in payload && payload.allIn === true) {
				stats.committed += payload.value;
			} else {
				stats.committed = payload.value;
			}
		} else if (payload.type === 16) {
			stats.refunded += payload.value;
		} else if (payload.type === 10) {
			stats.won += payload.value;
		}
	}

	for (const stats of statsMap.values()) {
		stats.net = stats.won - stats.committed + stats.refunded;
		stats.endingStack = stats.startingStack + stats.net;
	}

	return statsMap;
}

export function computeGameStats(game: ReplayFile): GameWithStats {
	const handStats: HandWithStats[] = game.hands.map((hand) => {
		const playerStats = computeHandPlayerStats(hand);
		const biggestPot = Math.max(
			...hand.events
				.filter((e) => e.payload.type === 10)
				.map((e) => (e.payload as { pot: number }).pot),
			0
		);
		return { hand, playerStats, biggestPot };
	});

	return {
		game,
		handStats,
		totalHands: game.hands.length,
		startTime: game.hands[0]?.startedAt ?? 0
	};
}

export function computeAggregateStats(
	games: GameWithStats[],
	identities: PlayerIdentity[]
): Map<string, PlayerResult> {
	const results = new Map<string, PlayerResult>();

	for (const identity of identities) {
		const playerId = identity.playerIds[0];
		results.set(playerId, {
			playerId,
			playerName: identity.displayName,
			displayName: identity.displayName,
			color: identity.color,
			gamesPlayed: 0,
			handsPlayed: 0,
			totalPnl: 0,
			biggestWin: 0,
			biggestLoss: 0,
			handsWon: 0,
			sessionResults: []
		});
	}

	for (const gameStats of games) {
		const game = gameStats.game;
		const sessionPlayerIds = new Set<string>();
		const gamePnl = new Map<string, number>();

		for (const handStats of gameStats.handStats) {
			for (const [pid, stats] of handStats.playerStats) {
				sessionPlayerIds.add(pid);

				const result = results.get(pid);
				if (!result) continue;

				result.handsPlayed++;
				result.totalPnl += stats.net;

				if (stats.net > 0) {
					result.biggestWin = Math.max(result.biggestWin, stats.net);
				} else if (stats.net < 0) {
					result.biggestLoss = Math.min(result.biggestLoss, stats.net);
				}

				if (stats.won > 0) {
					result.handsWon++;
				}

				gamePnl.set(pid, (gamePnl.get(pid) ?? 0) + stats.net);
			}
		}

		for (const pid of sessionPlayerIds) {
			const result = results.get(pid);
			if (!result) continue;

			result.gamesPlayed++;
			result.sessionResults.push({
				gameId: game.gameId,
				gameDate: gameStats.startTime,
				handsPlayed: gameStats.totalHands,
				pnl: gamePnl.get(pid) ?? 0
			});
		}
	}

	return results;
}

export function buildPlayerTimeline(games: GameWithStats[], playerId: string): ChartPoint[] {
	const points: ChartPoint[] = [];
	let cumulative = 0;

	const sorted = [...games].sort((a, b) => a.startTime - b.startTime);

	for (const gameStats of sorted) {
		let gamePnl = 0;
		for (const handStats of gameStats.handStats) {
			const pstats = handStats.playerStats.get(playerId);
			if (pstats) {
				gamePnl += pstats.net;
			}
		}
		cumulative += gamePnl;
		points.push({ x: gameStats.startTime, y: cumulative });
	}

	return points;
}

export function buildAllPlayerTimelines(
	games: GameWithStats[],
	identities: PlayerIdentity[]
): PlayerCumulativePoint[] {
	return identities.map((identity) => {
		const playerId = identity.playerIds[0];
		return {
			playerName: identity.displayName,
			color: identity.color,
			points: buildPlayerTimeline(games, playerId)
		};
	});
}

export function buildGameChipProgression(
	gameStats: GameWithStats,
	identities: PlayerIdentity[]
): PlayerCumulativePoint[] {
	return identities.map((identity) => {
		const playerId = identity.playerIds[0];
		const points: ChartPoint[] = [];
		for (const handStats of gameStats.handStats) {
			const pstats = handStats.playerStats.get(playerId);
			if (pstats) {
				points.push({ x: parseInt(handStats.hand.number), y: pstats.startingStack });
			}
		}
		return {
			playerName: identity.displayName,
			color: identity.color,
			points
		};
	});
}
