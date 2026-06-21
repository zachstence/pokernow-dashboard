import { describe, test, expect } from 'vitest';
import { loadHandsFile } from './loadHandsFile';
import { computeHandEndingBalances } from './computeHandEndingBalances';
import { loadPlayersFile } from './loadPlayersFile';
import { pokerNowPlayerIdToPlayerId } from './pokerNowPlayerIdToPlayerId';
import { convertStack } from './convertStack';

// This is mostly just a sanity test - would be better to use mock data and not have all the caveats

describe('computeHandEndingBalances', () => {
	test('ending balances should equal starting balance of next hand', async () => {
		const players = await loadPlayersFile();
		const handsFile = await loadHandsFile(
			'./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json'
		);

		const excludedHands = [
			// Player busted
			44,
			// Player added on
			55,
			// Players added on / rebought
			82
		];

		for (let h = 0; h < handsFile.hands.length - 1; h++) {
			if (excludedHands.includes(h)) continue;
			// const h = 44;
			const currentHand = handsFile.hands[h]!;
			const nextHand = handsFile.hands[h + 1]!;

			const expected = nextHand.players.reduce<{ [playerId: number]: number }>((acc, player) => {
				const playerInCurrentHand = currentHand.players.find((p) => p.id === player.id);
				if (!playerInCurrentHand) return acc;

				const playerId = pokerNowPlayerIdToPlayerId(players, player.id);
				const balance = convertStack(player.stack, currentHand.cents);
				acc[playerId] = balance;
				return acc;
			}, {});

			const actual = computeHandEndingBalances(players, currentHand);

			for (const nextHandPlayer of nextHand.players) {
				// Caveat: Player isn't in next hand, nothing to compare to
				if (!currentHand.players.find((p) => p.id === nextHandPlayer.id)) continue;

				const playerId = pokerNowPlayerIdToPlayerId(players, nextHandPlayer.id);
				const expectedBalance = convertStack(nextHandPlayer.stack, currentHand.cents);

				const actualBalance = actual[playerId];

				expect(actualBalance, `Hand index ${h}, playerId ${playerId} doesn't match`).toEqual(
					expectedBalance
				);
			}
		}
	});
});
