import { convertStack } from './convertStack';
import type { Hand } from './loadHandsFile';
import type { PlayersFile } from './loadPlayersFile';
import { pokerNowPlayerIdToPlayerId } from './pokerNowPlayerIdToPlayerId';

/**
 * @returns Each player's balance at the end of the hand
 */
export const computeHandEndingBalances = (
	players: PlayersFile,
	hand: Hand
): { [playerId: number]: number } => {
	const stacks: { [pokerNowPlayerId: string]: number } = {};
	for (const player of hand.players) {
		const pokerNowPlayerId = player.id;
		stacks[pokerNowPlayerId] = player.stack;
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

		stacks[pokerNowPlayerId]! += diff;
	}

	const balances: { [playerId: number]: number } = Object.fromEntries(
		Object.entries(stacks).map(([pokerNowPlayerId, stack]) => {
			const playerId = pokerNowPlayerIdToPlayerId(players, pokerNowPlayerId);
			const balance = convertStack(stack, hand.cents);
			return [playerId, balance];
		})
	);

	return balances;
};
