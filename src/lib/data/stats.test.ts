import { describe, it, expect } from 'vitest';
import {
	computeGameStats,
	computeAggregateStats,
	buildPlayerTimeline,
	buildGameChipProgression
} from './stats.js';
import type { ReplayFile, PlayerIdentity } from './types.js';

const identities: PlayerIdentity[] = [
	{ displayName: 'Zach', color: '#3b82f6', playerIds: ['P1'] },
	{ displayName: 'Zach 2', color: '#ef4444', playerIds: ['P2'] }
];

function makeGame(overrides: Partial<ReplayFile> = {}): ReplayFile {
	return {
		generatedAt: '2026-01-01T00:00:00.000Z',
		playerId: 'P1DfeAJ3jD',
		gameId: 'test-game-1',
		hands: [],
		...overrides
	};
}

function makeHand(overrides: Record<string, unknown> = {}) {
	return {
		id: 'hand-1',
		handVersion: 2,
		number: '1',
		gameType: 'th',
		cents: false,
		smallBlind: 10,
		bigBlind: 20,
		ante: null,
		straddleSeat: null,
		dealerSeat: 10,
		startedAt: 1780012307786,
		bombPot: false,
		sevenDeuceBounty: null,
		doubleBoard: null,
		players: [],
		events: [],
		...overrides
	};
}

describe('computeHandPlayerStats', () => {
	it('computes simple fold hand correctly', () => {
		const game = makeGame({
			gameId: 'fold-test',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1000 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 1000 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 11, seat: 10 } },
						{ at: 1003, payload: { type: 16, value: 5, seat: 1 } },
						{ at: 1004, payload: { type: 15 } },
						{ at: 1005, payload: { type: 10, seat: 1, value: 10, pot: 10 } }
					]
				})
			]
		});

		const stats = computeGameStats(game);
		expect(stats.totalHands).toBe(1);

		const h1 = stats.handStats[0]!;
		const p1 = h1.playerStats.get('P1')!;
		const p2 = h1.playerStats.get('P2')!;

		// P1 (Zach): BB=10, gets refund 5, wins 10
		expect(p1.committed).toBe(10);
		expect(p1.refunded).toBe(5);
		expect(p1.won).toBe(10);
		expect(p1.net).toBe(5);
		expect(p1.endingStack).toBe(1005);

		// P2 (Zach 2): SB=5, folds, no refund, no win
		expect(p2.committed).toBe(5);
		expect(p2.refunded).toBe(0);
		expect(p2.won).toBe(0);
		expect(p2.net).toBe(-5);
		expect(p2.endingStack).toBe(995);
	});

	it('computes all-in hand correctly', () => {
		const game = makeGame({
			gameId: 'allin-test',
			hands: [
				makeHand({
					id: 'h2',
					number: '1',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 100 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 500 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 10, value: 10 } },
						{ at: 2001, payload: { type: 2, seat: 1, value: 20 } },
						{ at: 2002, payload: { type: 8, seat: 10, value: 50 } },
						{ at: 2003, payload: { type: 8, seat: 1, value: 80 } },
						{ at: 2004, payload: { type: 7, seat: 10, value: 80 } },
						{ at: 2005, payload: { type: 7, seat: 1, value: 20, allIn: true } },
						{ at: 2006, payload: { type: 11, seat: 10 } },
						{ at: 2007, payload: { type: 16, value: 20, seat: 1 } },
						{ at: 2008, payload: { type: 15 } },
						{ at: 2009, payload: { type: 10, seat: 1, value: 160, pot: 160 } }
					]
				})
			]
		});

		const stats = computeGameStats(game);
		const h1 = stats.handStats[0]!;
		const p1 = h1.playerStats.get('P1')!;
		const p2 = h1.playerStats.get('P2')!;

		// P1: BB=20, raise to 80 (cumulative), then all-in for +20 = 100 total
		expect(p1.committed).toBe(100);
		expect(p1.refunded).toBe(20);
		expect(p1.won).toBe(160);
		expect(p1.net).toBe(80);
		expect(p1.endingStack).toBe(180);

		// P2: SB=10, raise to 50, then call 80
		expect(p2.committed).toBe(80);
		expect(p2.refunded).toBe(0);
		expect(p2.won).toBe(0);
		expect(p2.net).toBe(-80);
		expect(p2.endingStack).toBe(420);
	});

	it('handles multi-hand game', () => {
		const game = makeGame({
			gameId: 'multi-hand',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 200 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 200 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 7, seat: 10, value: 10 } },
						{ at: 1003, payload: { type: 11, seat: 1 } },
						{ at: 1004, payload: { type: 16, value: 10, seat: 10 } },
						{ at: 1005, payload: { type: 15 } },
						{ at: 1006, payload: { type: 10, seat: 10, value: 10, pot: 10 } }
					]
				}),
				makeHand({
					id: 'h2',
					number: '2',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 190 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 210 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 1, value: 5 } },
						{ at: 2001, payload: { type: 2, seat: 10, value: 10 } },
						{ at: 2002, payload: { type: 7, seat: 1, value: 10 } },
						{ at: 2003, payload: { type: 0, seat: 10 } },
						{
							at: 2004,
							payload: { type: 9, turn: 1, run: 1, cards: ['Kd', '3d', '9h'], handsLabels: {} }
						},
						{ at: 2005, payload: { type: 0, seat: 10 } },
						{ at: 2006, payload: { type: 0, seat: 1 } },
						{ at: 2007, payload: { type: 9, turn: 2, run: 1, cards: ['6c'], handsLabels: {} } },
						{ at: 2008, payload: { type: 0, seat: 10 } },
						{ at: 2009, payload: { type: 0, seat: 1 } },
						{ at: 2010, payload: { type: 9, turn: 3, run: 1, cards: ['8d'], handsLabels: {} } },
						{ at: 2011, payload: { type: 0, seat: 10 } },
						{ at: 2012, payload: { type: 0, seat: 1 } },
						{ at: 2013, payload: { type: 15 } },
						{ at: 2014, payload: { type: 10, seat: 10, value: 20, pot: 20 } }
					]
				})
			]
		});

		const stats = computeGameStats(game);
		expect(stats.totalHands).toBe(2);

		// Hand 1: P1 net = -10, P2 net = 5
		const h1 = stats.handStats[0]!.playerStats;
		expect(h1.get('P1')!.net).toBe(-10);
		expect(h1.get('P2')!.net).toBe(10);

		// Hand 2: P1 net = -10, P2 net = 10
		const h2 = stats.handStats[1]!.playerStats;
		expect(h2.get('P1')!.net).toBe(-10);
		expect(h2.get('P2')!.net).toBe(10);
	});
});

describe('computeAggregateStats', () => {
	it('aggregates stats across multiple games', () => {
		const game1 = makeGame({
			gameId: 'game-1',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1000 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 1000 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 11, seat: 10 } },
						{ at: 1003, payload: { type: 16, value: 5, seat: 1 } },
						{ at: 1004, payload: { type: 15 } },
						{ at: 1005, payload: { type: 10, seat: 1, value: 10, pot: 10 } }
					]
				})
			]
		});

		const game2 = makeGame({
			gameId: 'game-2',
			hands: [
				makeHand({
					id: 'h2',
					number: '1',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1005 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 995 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 2001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 2002, payload: { type: 7, seat: 10, value: 10 } },
						{ at: 2003, payload: { type: 11, seat: 1 } },
						{ at: 2004, payload: { type: 16, value: 10, seat: 10 } },
						{ at: 2005, payload: { type: 15 } },
						{ at: 2006, payload: { type: 10, seat: 10, value: 10, pot: 10 } }
					]
				})
			]
		});

		const gs1 = computeGameStats(game1);
		const gs2 = computeGameStats(game2);
		const aggregate = computeAggregateStats([gs1, gs2], identities);

		const zach = aggregate.get('P1')!;
		const zach2 = aggregate.get('P2')!;

		expect(zach.handsPlayed).toBe(2);
		expect(zach.gamesPlayed).toBe(2);
		// Game 1: net=5, Game 2: net=-10
		expect(zach.totalPnl).toBe(-5);
		expect(zach.biggestWin).toBe(5);

		expect(zach2.handsPlayed).toBe(2);
		expect(zach2.gamesPlayed).toBe(2);
		// Game 1: net=-5, Game 2: net=10
		expect(zach2.totalPnl).toBe(5);
		expect(zach2.biggestWin).toBe(10);
	});
});

describe('buildPlayerTimeline', () => {
	it('builds cumulative timeline for a player', () => {
		const game = makeGame({
			gameId: 'timeline-test',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1000 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 1000 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 7, seat: 1, value: 10 } },
						{ at: 1003, payload: { type: 11, seat: 10 } },
						{ at: 1004, payload: { type: 15 } },
						{ at: 1005, payload: { type: 10, seat: 1, value: 20, pot: 20 } }
					]
				}),
				makeHand({
					id: 'h2',
					number: '2',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1010 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 990 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 1, value: 5 } },
						{ at: 2001, payload: { type: 2, seat: 10, value: 10 } },
						{ at: 2002, payload: { type: 11, seat: 1 } },
						{ at: 2003, payload: { type: 16, value: 5, seat: 10 } },
						{ at: 2004, payload: { type: 15 } },
						{ at: 2005, payload: { type: 10, seat: 10, value: 10, pot: 10 } }
					]
				})
			]
		});

		const gs = computeGameStats(game);
		const timeline = buildPlayerTimeline([gs], 'P1');
		expect(timeline).toHaveLength(1);
	});

	it('builds overall player timeline across sessions', () => {
		const game1 = makeGame({
			gameId: 'g1',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1000 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 1000 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 11, seat: 10 } },
						{ at: 1003, payload: { type: 16, value: 5, seat: 1 } },
						{ at: 1004, payload: { type: 15 } },
						{ at: 1005, payload: { type: 10, seat: 1, value: 10, pot: 10 } }
					]
				})
			]
		});

		const game2 = makeGame({
			gameId: 'g2',
			hands: [
				makeHand({
					id: 'h2',
					number: '1',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1005 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 995 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 2001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 2002, payload: { type: 7, seat: 10, value: 10 } },
						{ at: 2003, payload: { type: 11, seat: 1 } },
						{ at: 2004, payload: { type: 16, value: 10, seat: 10 } },
						{ at: 2005, payload: { type: 15 } },
						{ at: 2006, payload: { type: 10, seat: 10, value: 10, pot: 10 } }
					]
				})
			]
		});

		const gs1 = computeGameStats(game1);
		const gs2 = computeGameStats(game2);
		const timeline = buildPlayerTimeline([gs1, gs2], 'P1');
		expect(timeline).toHaveLength(2);
		expect(timeline[0]!.x).toBe(1000);
		expect(timeline[0]!.y).toBe(5);
		expect(timeline[1]!.x).toBe(2000);
		expect(timeline[1]!.y).toBe(-5);
	});
});

describe('buildGameChipProgression', () => {
	it('builds chip progression for each player across hands', () => {
		const game = makeGame({
			gameId: 'progression-test',
			hands: [
				makeHand({
					id: 'h1',
					number: '1',
					startedAt: 1000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1000 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 1000 }
					],
					events: [
						{ at: 1000, payload: { type: 3, seat: 10, value: 5 } },
						{ at: 1001, payload: { type: 2, seat: 1, value: 10 } },
						{ at: 1002, payload: { type: 11, seat: 10 } },
						{ at: 1003, payload: { type: 16, value: 5, seat: 1 } },
						{ at: 1004, payload: { type: 15 } },
						{ at: 1005, payload: { type: 10, seat: 1, value: 10, pot: 10 } }
					]
				}),
				makeHand({
					id: 'h2',
					number: '2',
					startedAt: 2000,
					players: [
						{ id: 'P1', seat: 1, name: 'Zach', stack: 1005 },
						{ id: 'P2', seat: 10, name: 'Zach 2', stack: 995 }
					],
					events: [
						{ at: 2000, payload: { type: 3, seat: 1, value: 5 } },
						{ at: 2001, payload: { type: 2, seat: 10, value: 10 } },
						{ at: 2002, payload: { type: 11, seat: 1 } },
						{ at: 2003, payload: { type: 16, value: 5, seat: 10 } },
						{ at: 2004, payload: { type: 15 } },
						{ at: 2005, payload: { type: 10, seat: 10, value: 10, pot: 10 } }
					]
				})
			]
		});

		const gs = computeGameStats(game);
		const progression = buildGameChipProgression(gs, identities);
		expect(progression).toHaveLength(2);

		const zach = progression.find((p) => p.playerName === 'Zach')!;
		expect(zach.points).toHaveLength(2);
		expect(zach.points[0]!.y).toBe(1000);
		expect(zach.points[1]!.y).toBe(1005);
	});
});
