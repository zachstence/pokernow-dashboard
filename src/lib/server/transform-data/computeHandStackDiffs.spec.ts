import { describe, test, expect } from 'vitest';
import { loadHandsFile } from './loadHandsFile';
import { computeHandStackDiffs } from './computeHandStackDiffs';

// This is mostly just a sanity test - would be better to use mock data and not have all the caveats

describe('computeHandStackDiffs', () => {
	test('stack diffs should equal difference between stacks', async () => {
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

			const actual = computeHandStackDiffs(currentHand);

			for (const current of currentHand.players) {
				const next = nextHand.players.find((p) => p.id === current.id);
				// Player isn't in next hand, nothing to compare to
				if (!next) continue;

				const expectedDiff = next.stack - current.stack;

				const actualDiff = actual[current.id];

				expect(actualDiff, `Hand index ${h}, ${current.id} doesn't match`).toEqual(expectedDiff);
			}
		}
	});
});
