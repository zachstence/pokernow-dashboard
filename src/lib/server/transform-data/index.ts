import { buildProfitLossData, type ProfitLossData } from './buildProfitLossData';
import { convertStack } from './convertStack';
import type { CollectEventPayload, HandEvent, HandsFile } from './loadHandsFile';
import { loadHandsFiles } from './loadHandsFiles';
import { loadPlayersFile, type PlayersFile } from './loadPlayersFile';
import { pokerNowPlayerIdToPlayerId } from './pokerNowPlayerIdToPlayerId';

export type PlayerStats = {
	sessionsPlayed: number;
	handsPlayed: number;
	vpip: number;
	pfr: number;
	threeBet: number;
	aggFactor: number;
	wtsd: number;
	wsd: number;
};

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

	playerStats: {
		[playerId: number]: PlayerStats;
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

	const playerStats = players.reduce<{ [playerId: number]: PlayerStats }>((playerStats, player) => {
		const stats = computePlayerStats(players, player.id, handsFiles);
		playerStats[player.id] = stats;
		return playerStats;
	}, {});

	console.log(playerStats);

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
		},
		playerStats
	};
};

const computePlayerStats = (
	players: PlayersFile,
	playerId: number,
	handsFiles: HandsFile[]
): PlayerStats => {
	let playedHands = 0;
	let vpipHands = 0;
	let pfrHands = 0;

	for (const handsFile of handsFiles) {
		for (const hand of handsFile.hands) {
			const handPlayer = hand.players.find(
				(hp) => pokerNowPlayerIdToPlayerId(players, hp.id) === playerId
			);
			if (!handPlayer) continue;

			playedHands++;

			let vpip = false;
			let pfr = false;
			for (const event of hand.events) {
				if (event.payload.type === 'DealBoardCard') break;
				const isEventForPlayer = 'seat' in event.payload && event.payload.seat === handPlayer.seat;
				if (!isEventForPlayer) continue;

				if (event.payload.type === 'Call' || event.payload.type === 'Raise') {
					vpip = true;
				}
				if (event.payload.type === 'Raise') {
					pfr = true;
				}
			}

			if (vpip) vpipHands++;
			if (pfr) pfrHands++;
		}
	}

	return {
		sessionsPlayed: 0,
		handsPlayed: 0,
		vpip: vpipHands / playedHands,
		pfr: pfrHands / playedHands,
		threeBet: 0,
		aggFactor: 0,
		wtsd: 0,
		wsd: 0
	};
};
