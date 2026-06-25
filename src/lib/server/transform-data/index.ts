import { buildProfitLossData, type ProfitLossData } from './buildProfitLossData';
import { convertStack } from './convertStack';
import type { CollectEventPayload, HandEvent, HandsFile } from './loadHandsFile';
import { loadHandsFiles } from './loadHandsFiles';
import { loadPlayersFile, type PlayersFile } from './loadPlayersFile';

type Stats = {
	players: PlayersFile;
	// TODO refactor hands files to be "sessions", they have an id and other app info as well as the pokernow hands, collapse the two below
	handsFiles: HandsFile[];
	sessions: { title: string; url: string }[];

	overview: {
		totalSessionsPlayed: number;
		totalHandsPlayed: number;
		totalPlayers: number;
		biggestPot: number;
		profitLossData: ProfitLossData;
	};
};

export const computeStats = async (): Promise<Stats> => {
	const players = await loadPlayersFile();
	const handsFiles = await loadHandsFiles();
	const sessions = handsFiles
		.sort((a, b) => b.hands[0]!.startedAt.getTime() - a.hands[0]!.startedAt.getTime())
		.map((handsFile, i) => ({
			title: handsFile.hands[0]!.startedAt.toLocaleDateString(),
			url: `/sessions/${i + 1}`
		}));

	const profitLossData = await buildProfitLossData(players, handsFiles);
	const totalSessionsPlayed = handsFiles.length;
	const totalHandsPlayed = handsFiles.reduce<number>(
		(sum, handsFile) => sum + handsFile.hands.length,
		0
	);
	const totalPlayers = players.length;
	const biggestPot = handsFiles.reduce<number>((biggestPot, handsFile, f) => {
		const biggestPotFromFile = handsFile.hands.reduce<number>((biggestPotFromFile, hand, h) => {
			const collectEventPayload = hand.events.find((e) => e.payload.type === 'Collect')?.payload as
				| CollectEventPayload
				| undefined;
			if (!collectEventPayload) return biggestPotFromFile;

			const converted = convertStack(collectEventPayload.pot, hand.cents);
			if (converted > biggestPotFromFile) {
				return converted;
			}
			return biggestPotFromFile;
		}, 0);

		if (biggestPotFromFile > biggestPot) {
			return biggestPotFromFile;
		}
		return biggestPot;
	}, 0);

	return {
		players,
		handsFiles,
		sessions,
		overview: {
			totalSessionsPlayed,
			totalHandsPlayed,
			totalPlayers,
			biggestPot,
			profitLossData
		}
	};
};
