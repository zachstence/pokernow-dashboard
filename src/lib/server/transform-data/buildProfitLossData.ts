import { computeHandStackDiffs } from './computeHandStackDiffs';
import { convertStack } from './convertStack';
import type { HandsFile } from './loadHandsFile';
import type { PlayersFile } from './loadPlayersFile';
import { pokerNowPlayerIdToPlayerId } from './pokerNowPlayerIdToPlayerId';
import { round } from './round';

// every player series needs to start with a 0 and end with their current balance so the graph is fully connected (either dotted or solid) all the way through
// Leave null values when they weren't playing, but be sure to have their end/start balance points for the dotted line

export type ProfitLossData = {
	[playerId: number]: {
		handNumber: number;
		value: number;
		played: boolean;
	}[];
};

export const buildProfitLossData = (
	players: PlayersFile,
	handsFiles: HandsFile[]
): ProfitLossData => {
	const data: ProfitLossData = {};
	for (const player of players) {
		data[player.id] = [];
	}

	for (const file of handsFiles) {
		for (let h = 0; h < file.hands.length; h++) {
			const hand = file.hands[h]!;
			const stackDiffs = computeHandStackDiffs(hand);

			for (const player of players) {
				const playerData = data[player.id]!;
				const lastValue = playerData[playerData.length - 1]?.value ?? 0;

				const handPlayer = hand.players.find(
					(p) => pokerNowPlayerIdToPlayerId(players, p.id) === player.id
				);
				if (!handPlayer) {
					playerData.push({
						handNumber: h + 1,
						value: lastValue,
						played: false
					});
					continue;
				}
				const { handDiff, postedMissingSmallBlind } = stackDiffs[handPlayer.id]!;

				// Adjust previous hand for postedMissingSmallBlind amount
				let postedMissingSmallBlindDiff = undefined;
				if (postedMissingSmallBlind !== undefined) {
					const previousHand = file.hands[h - 1]!;
					postedMissingSmallBlindDiff = convertStack(
						postedMissingSmallBlind ?? 0,
						previousHand.cents
					);
					playerData[playerData.length - 1]!.value += postedMissingSmallBlindDiff;
				}

				const diff = convertStack(handDiff, hand.cents);
				const value = round(lastValue + diff, 2);

				playerData.push({
					handNumber: h + 1,
					value,
					played: true
				});
			}
		}
	}

	return data;
};
