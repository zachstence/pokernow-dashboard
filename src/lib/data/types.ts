import type { output } from 'zod';
import type { replayFileSchema } from '$lib/schemas/replay.js';

export type ReplayFile = output<typeof replayFileSchema>;
export type Hand = ReplayFile['hands'][number];
export type PlayerInHand = Hand['players'][number];
export type HandEvent = Hand['events'][number];
export type EventPayload = HandEvent['payload'];

export interface PlayerIdentity {
	displayName: string;
	color: string;
	playerIds: string[];
}

export interface HandPlayerStats {
	playerId: string;
	playerName: string;
	startingStack: number;
	committed: number;
	refunded: number;
	won: number;
	net: number;
	endingStack: number;
}

export interface HandWithStats {
	hand: Hand;
	playerStats: Map<string, HandPlayerStats>;
	biggestPot: number;
}

export interface GameWithStats {
	game: ReplayFile;
	handStats: HandWithStats[];
	totalHands: number;
	startTime: number;
}

export interface PlayerResult {
	playerId: string;
	playerName: string;
	displayName: string;
	color: string;
	gamesPlayed: number;
	handsPlayed: number;
	totalPnl: number;
	biggestWin: number;
	biggestLoss: number;
	handsWon: number;
	sessionResults: SessionResult[];
}

export interface SessionResult {
	gameId: string;
	gameDate: number;
	handsPlayed: number;
	pnl: number;
}

export interface ChartPoint {
	x: string | number;
	y: number;
}

export interface PlayerCumulativePoint {
	playerName: string;
	color: string;
	points: ChartPoint[];
}
