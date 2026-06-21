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
		data[player.id] = [
			{
				handNumber: 0,
				value: 0,
				played: false
			}
		];
	}

	let handNumber = 1;
	for (const file of handsFiles) {
		for (const hand of file.hands) {
			const stackDiffs = computeHandStackDiffs(hand);

			for (const player of players) {
				const playerData = data[player.id]!;
				const lastValue = playerData[playerData.length - 1]!.value;

				const handPlayer = hand.players.find(
					(p) => pokerNowPlayerIdToPlayerId(players, p.id) === player.id
				);
				if (!handPlayer) {
					playerData.push({
						handNumber,
						value: lastValue,
						played: false
					});
					continue;
				}

				const prev = playerData[playerData.length - 1]!.value;
				const diff = convertStack(stackDiffs[handPlayer.id]!, hand.cents);
				const value = round(prev + diff, 2);

				playerData.push({
					handNumber,
					value,
					played: true
				});
			}
		}
	}

	return data;
};
