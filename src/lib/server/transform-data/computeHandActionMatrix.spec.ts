import { describe, test, expect } from 'vitest';
import { loadHandsFile } from './loadHandsFile';
import { computeHandActionMatrix } from './computeHandActionMatrix';
import { loadPlayersFile } from './loadPlayersFile';

const gameIdToHandsFilePath = (gameId: string) => `./data/poker-now-hands-game-${gameId}.json`;

describe('computeHandActionMatrix', () => {
	test.each([
		{
			gameId: 'pglEsrF8SW29GXxYE01E0rGMB',
			handNumber: 40,
			expectedActionMatrix: {
				7: { 1: 23.5, 2: 8.37 },
				8: { 1: 2.0 },
				2: { 1: 23.5 }
			}
		},
		{
			gameId: 'pgl58oO75jyKcqWgT6e1IOO8V',
			handNumber: 88,
			expectedActionMatrix: {
				3: { 7: 14.64 },
				2: { 7: 14.64, 3: 19.17 }
			}
		}
	])(
		'gameId: $gameId, handNumber: $handNumber',
		async ({ gameId, handNumber, expectedActionMatrix }) => {
			const handsFilePath = gameIdToHandsFilePath(gameId);
			const handsFile = await loadHandsFile(handsFilePath);
			const hand = handsFile.hands[handNumber - 1];
			if (!hand) throw new Error(`Expected a hands file to exist at ${handsFilePath}`);
			const players = await loadPlayersFile();
			const actualActionMatrix = computeHandActionMatrix(players, hand);
			expect(actualActionMatrix).toEqual(expectedActionMatrix);
		}
	);
});
