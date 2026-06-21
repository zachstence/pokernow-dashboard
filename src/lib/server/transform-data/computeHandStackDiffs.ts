import type { Hand } from './loadHandsFile';

/**
 * @returns Each player's difference in stack from the start to the end of a hand
 */
export const computeHandStackDiffs = (hand: Hand): { [pokerNowPlayerId: string]: number } => {
	const diffs: { [pokerNowPlayerId: string]: number } = {};
	for (const player of hand.players) {
		const pokerNowPlayerId = player.id;
		diffs[pokerNowPlayerId] = 0;
	}

	for (const player of hand.players) {
		const pokerNowPlayerId = player.id;
		let diff = 0;
		let runningDiff = 0;

		for (const event of hand.events) {
			const payload = event.payload;
			if ('seat' in payload && payload.seat !== player.seat) continue;

			if (payload.type === 'Collect' || payload.type === 'Uncall') {
				runningDiff += payload.value;
			} else if (
				payload.type === 'PostBigBlind' ||
				payload.type === 'PostSmallBlind' ||
				payload.type === 'PostMissingBigBlind' ||
				payload.type === 'PostMissingSmallBlind' ||
				payload.type === 'Call' ||
				payload.type === 'Raise'
			) {
				runningDiff = -payload.value;
			}

			if (
				payload.type === 'DealBoardCard' ||
				payload.type === 'Fold' ||
				payload.type === 'Collect' ||
				payload.type === 'HandFinished'
			) {
				diff += runningDiff;
				runningDiff = 0;
			}
		}

		diffs[pokerNowPlayerId]! += diff;
	}

	return diffs;
};
