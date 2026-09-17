import { describe, test, expect } from 'vitest';
import { loadHandsFile } from './loadHandsFile';
import { computeHandActionMatrix } from './computeHandActionMatrix';

const gameIdToHandsFilePath = (gameId: string) => `./data/poker-now-hands-game-${gameId}.json`;

describe('computeHandActionMatrix', () => {
	test.each([
		{
			gameId: 'pglEsrF8SW29GXxYE01E0rGMB',
			handNumber: 40,
			expectedActionMatrix: {
				Kv8MwICUbu: { gKkbM5nCAy: 2350, sGFj45LHCA: 837 },
				'4lRko4mF8A': { gKkbM5nCAy: 200 },
				sGFj45LHCA: { gKkbM5nCAy: 2350 }
			}
		},
		{
			gameId: 'pgl58oO75jyKcqWgT6e1IOO8V',
			handNumber: 88,
			expectedActionMatrix: {
				iAu0FHpBA1: { Kv8MwICUbu: 1464 },
				'0ru6KtUj_V': { Kv8MwICUbu: 1464, iAu0FHpBA1: 1917 }
			}
		}
	])(
		'gameId: $gameId, handNumber: $handNumber',
		async ({ gameId, handNumber, expectedActionMatrix }) => {
			const handsFilePath = gameIdToHandsFilePath(gameId);
			const handsFile = await loadHandsFile(handsFilePath);
			const hand = handsFile.hands[handNumber - 1];
			if (!hand) throw new Error(`Expected a hands file to exist at ${handsFilePath}`);
			const actualActionMatrix = computeHandActionMatrix(hand);
			expect(actualActionMatrix).toEqual(expectedActionMatrix);
		}
	);
});
