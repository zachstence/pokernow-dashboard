import fs from 'node:fs';
import path from 'node:path';

interface PlayerConfig {
	id: string;
	name: string;
}

const PLAYERS: PlayerConfig[] = [
	{ id: 'p1_aBcDeFgHiJ', name: 'Alice' },
	{ id: 'p2_bCdEfGhIjK', name: 'Bob' },
	{ id: 'p3_cDeFgHiJkL', name: 'Charlie' },
	{ id: 'p4_dEfGhIjKlM', name: 'Diana' },
	{ id: 'p5_eFgHiJkLmN', name: 'Eve' }
];

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];

function randomCard(): string {
	return pick(RANKS) + pick(SUITS);
}

function dealHoles(playerCount: number): string[][] {
	const deck = new Set<string>();
	for (const r of RANKS) {
		for (const s of SUITS) {
			deck.add(r + s);
		}
	}
	const shuffled = shuffle([...deck]);
	const hands: string[][] = [];
	let idx = 0;
	for (let i = 0; i < playerCount; i++) {
		hands.push([shuffled[idx++]!, shuffled[idx++]!]);
	}
	return hands;
}

interface HandEvent {
	at: number;
	payload: Record<string, unknown>;
}

interface GeneratedPlayer {
	id: string;
	seat: number;
	name: string;
	stack: number;
	hand?: string[];
}

interface GeneratedHand {
	id: string;
	handVersion: number;
	number: string;
	gameType: string;
	cents: boolean;
	smallBlind: number;
	bigBlind: number;
	ante: null;
	straddleSeat: null;
	dealerSeat: number;
	startedAt: number;
	bombPot: boolean;
	sevenDeuceBounty: null;
	doubleBoard: null;
	players: GeneratedPlayer[];
	events: HandEvent[];
}

interface ReplayFile {
	generatedAt: string;
	playerId: string;
	gameId: string;
	hands: GeneratedHand[];
}

function generateGameId(index: number): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	let suffix = '';
	for (let i = 0; i < 22; i++) suffix += pick([...chars]);
	return `game${index}_${suffix}`;
}

interface ActivePlayer {
	id: string;
	name: string;
	seat: number;
	stack: number;
	hand: string[];
	committedThisHand: number;
}

interface ActionResult {
	playerId: string;
	committed: number;
	refunded: number;
	won: number;
}

function generateHandEvents(
	handPlayers: ActivePlayer[],
	smallBlind: number,
	bigBlind: number,
	handStartTime: number
): { events: HandEvent[]; results: ActionResult[]; winningPlayer: string | null; potSize: number } {
	const events: HandEvent[] = [];
	let at = handStartTime;

	const results: ActionResult[] = handPlayers.map((p) => ({
		playerId: p.id,
		committed: 0,
		refunded: 0,
		won: 0
	}));

	const seats = handPlayers.map((p) => p.seat);
	const dealerSeat = seats[0]!;
	const sortedBySeat = [...handPlayers].sort((a, b) => {
		let diff = a.seat - dealerSeat;
		if (diff <= 0) diff += 10;
		return (b.seat - dealerSeat > 0 ? b.seat - dealerSeat : b.seat - dealerSeat + 10) - diff;
	});

	const sbPlayer = sortedBySeat[0]!;
	const bbPlayer = sortedBySeat[1]!;

	// Small blind
	events.push({ at, payload: { type: 3, seat: sbPlayer.seat, value: smallBlind } });
	const sbResult = results.find((r) => r.playerId === sbPlayer.id)!;
	sbResult.committed = smallBlind;

	at += randInt(1, 5);

	// Big blind
	events.push({ at, payload: { type: 2, seat: bbPlayer.seat, value: bigBlind } });
	const bbResult = results.find((r) => r.playerId === bbPlayer.id)!;
	bbResult.committed = bigBlind;

	at += randInt(1, 5);

	const activePlayers = [...handPlayers];
	let currentBet = bigBlind;

	// Track who's left
	const foldedPlayers = new Set<string>();

	// Each player (except BB) acts
	const actionOrder = [...sortedBySeat.slice(2), ...sortedBySeat.slice(0, 2)];

	for (const p of actionOrder) {
		const canRaise = p.stack > currentBet;
		const actionRoll = Math.random();

		if (actionRoll < 0.3) {
			const result = results.find((r) => r.playerId === p.id)!;
			const refund = result.committed;
			result.refunded += refund;
			result.committed = 0;
			events.push({ at, payload: { type: 11, seat: p.seat } });
			foldedPlayers.add(p.id);
			at += randInt(1, 3);
		} else if (actionRoll < 0.7 || !canRaise) {
			const result = results.find((r) => r.playerId === p.id)!;
			if (result.committed < currentBet) {
				const callAmount = currentBet;
				result.committed = callAmount;
				events.push({ at, payload: { type: 7, seat: p.seat, value: callAmount } });
			} else {
				events.push({ at, payload: { type: 0, seat: p.seat } });
			}
			at += randInt(1, 3);
		} else {
			const raiseMultiplier = Math.random() < 0.3 ? 0.5 : 0.75;
			const raiseAmount = Math.min(
				Math.floor(currentBet * (1 + raiseMultiplier)),
				currentBet + p.stack
			);
			currentBet = raiseAmount;
			const result = results.find((r) => r.playerId === p.id)!;
			result.committed = raiseAmount;
			events.push({ at, payload: { type: 8, seat: p.seat, value: raiseAmount } });
			at += randInt(1, 3);
		}
	}

	// Community cards
	const board = [randomCard(), randomCard(), randomCard()];
	events.push({
		at,
		payload: {
			type: 9,
			turn: 1,
			run: 1,
			cards: board,
			handsLabels: {}
		}
	});
	at += randInt(10, 50);

	// Flop actions (only if >= 2 active)
	const remaining = activePlayers.filter((p) => !foldedPlayers.has(p.id));
	if (remaining.length >= 2) {
		let flopBet = currentBet > bigBlind ? currentBet : bigBlind;
		for (const p of remaining) {
			if (foldedPlayers.has(p.id)) continue;

			const result = results.find((r) => r.playerId === p.id)!;
			const actionRoll = Math.random();
			if (actionRoll < 0.2) {
				events.push({ at, payload: { type: 0, seat: p.seat } });
				at += randInt(1, 3);
			} else if (actionRoll < 0.6) {
				const callAmount = Math.max(flopBet, result.committed);
				if (callAmount > result.committed) {
					result.committed = callAmount;
				}
				events.push({ at, payload: { type: 7, seat: p.seat, value: result.committed } });
				at += randInt(1, 3);
			} else if (actionRoll < 0.85) {
				const raiseSize = Math.floor(flopBet * 0.6);
				flopBet += raiseSize;
				result.committed = flopBet;
				events.push({ at, payload: { type: 8, seat: p.seat, value: flopBet } });
				at += randInt(1, 3);
			} else {
				const allInAmount = p.stack - result.committed;
				if (allInAmount > 0) {
					result.committed += allInAmount;
					events.push({
						at,
						payload: { type: 8, seat: p.seat, value: result.committed, allIn: true }
					});
					at += randInt(1, 3);
				}
			}
		}
	}

	const remaining2 = activePlayers.filter((p) => !foldedPlayers.has(p.id));

	// Turn card
	events.push({
		at,
		payload: {
			type: 9,
			turn: 2,
			run: 1,
			cards: [randomCard()],
			handsLabels: {}
		}
	});
	at += randInt(10, 50);

	if (remaining2.length >= 2) {
		for (const p of remaining2) {
			if (foldedPlayers.has(p.id)) continue;
			const result = results.find((r) => r.playerId === p.id)!;
			if (Math.random() < 0.3) {
				events.push({ at, payload: { type: 0, seat: p.seat } });
				at += randInt(1, 3);
			} else {
				const callAmount = currentBet;
				if (callAmount > result.committed) {
					result.committed = callAmount;
				}
				events.push({ at, payload: { type: 7, seat: p.seat, value: result.committed } });
				at += randInt(1, 3);
			}
		}
	}

	const remaining3 = activePlayers.filter((p) => !foldedPlayers.has(p.id));

	// River card
	events.push({
		at,
		payload: {
			type: 9,
			turn: 3,
			run: 1,
			cards: [randomCard()],
			handsLabels: {}
		}
	});
	at += randInt(10, 50);

	if (remaining3.length >= 2) {
		for (const p of remaining3) {
			if (foldedPlayers.has(p.id)) continue;
			const result = results.find((r) => r.playerId === p.id)!;
			if (Math.random() < 0.5) {
				events.push({ at, payload: { type: 0, seat: p.seat } });
				at += randInt(1, 3);
			} else {
				events.push({ at, payload: { type: 7, seat: p.seat, value: result.committed } });
				at += randInt(1, 3);
			}
		}
	}

	at += randInt(5, 20);

	// Hand complete
	events.push({ at, payload: { type: 15 } });

	// Determine winner
	let winningPlayer: string | null = null;
	if (remaining3.length === 1) {
		// Last player standing (everyone else folded)
		winningPlayer = remaining3[0]!.id;
	} else {
		// Winner by "showdown" - assign to one of remaining players
		winningPlayer = pick(remaining3.filter((p) => !foldedPlayers.has(p.id)))?.id ?? null;
	}

	const totalPot = results.reduce((sum, r) => sum + r.committed - r.refunded, 0);

	if (winningPlayer) {
		const winnerResult = results.find((r) => r.playerId === winningPlayer)!;
		winnerResult.won = totalPot;

		events.push({
			at: at + 1,
			payload: {
				type: 10,
				pot: totalPot,
				seat: activePlayers.find((p) => p.id === winningPlayer)!.seat,
				value: totalPot,
				position: 1
			}
		});
	}

	return { events, results, winningPlayer, potSize: totalPot };
}

function generateSession(
	sessionIndex: number,
	players: PlayerConfig[],
	sessionPlayerStacks: Map<string, number>,
	baseTime: number
): ReplayFile | null {
	const numHands = randInt(4, 12);
	const smallBlind = pick([5, 10, 25, 50]);
	const bigBlind = smallBlind * 2;
	const gameId = generateGameId(sessionIndex);

	// Select active players (3-5)
	const activePlayers = shuffle(players).slice(0, randInt(3, players.length));

	const hands: GeneratedHand[] = [];

	for (let h = 0; h < numHands; h++) {
		const handStartTime = baseTime + h * randInt(10000, 60000);
		const handId = `hand_${sessionIndex}_${h}_${generateGameId(0).slice(0, 10)}`;

		// Assign seats (rotate)
		const seatedPlayers = shuffle(activePlayers).map((p, i) => ({
			...p,
			seat: (i + 1) * 2 + 1,
			stack: sessionPlayerStacks.get(p.id) ?? randInt(100, 2000),
			hand: [] as string[]
		})) as ActivePlayer[];

		// Deal holes
		const holes = dealHoles(seatedPlayers.length);
		for (let pi = 0; pi < seatedPlayers.length; pi++) {
			seatedPlayers[pi]!.hand = holes[pi]!;
		}

		const { events, results } = generateHandEvents(
			seatedPlayers,
			smallBlind,
			bigBlind,
			handStartTime
		);

		// Update stacks for next hand
		for (const result of results) {
			const current = sessionPlayerStacks.get(result.playerId) ?? 0;
			const net = result.won - result.committed + result.refunded;
			sessionPlayerStacks.set(result.playerId, current + net);
		}

		hands.push({
			id: handId,
			handVersion: 2,
			number: String(h + 1),
			gameType: 'th',
			cents: false,
			smallBlind,
			bigBlind,
			ante: null,
			straddleSeat: null,
			dealerSeat: seatedPlayers[0]?.seat ?? 1,
			startedAt: handStartTime,
			bombPot: false,
			sevenDeuceBounty: null,
			doubleBoard: null,
			players: seatedPlayers.map((p) => ({
				id: p.id,
				seat: p.seat,
				name: p.name,
				stack: p.stack,
				hand: Math.random() < 0.7 ? p.hand : undefined
			})),
			events
		});
	}

	if (hands.length === 0) return null;

	return {
		generatedAt: new Date(baseTime).toISOString(),
		playerId: activePlayers[0]!.id,
		gameId,
		hands
	};
}

// Generate sessions
const outputDir = path.resolve('data');

// Initial stacks
const stacks = new Map<string, number>();
for (const p of PLAYERS) {
	stacks.set(p.id, randInt(500, 2000));
}

const sessions = [
	{ index: 1, daysAgo: 14, hour: 19 },
	{ index: 2, daysAgo: 10, hour: 20 },
	{ index: 3, daysAgo: 5, hour: 18 },
	{ index: 4, daysAgo: 1, hour: 21 }
];

const baseTime = Date.now();
for (const session of sessions) {
	const sessionTime = baseTime - session.daysAgo * 86400000 + session.hour * 3600000;
	const replay = generateSession(session.index, PLAYERS, stacks, sessionTime);
	if (replay) {
		const filename = `poker-now-hands-game-${replay.gameId}.json`;
		const filepath = path.join(outputDir, filename);
		fs.writeFileSync(filepath, JSON.stringify(replay, null, 2));
		console.log(`Generated: ${filename}`);
	}
}
