import { convertStack } from './convertStack';
import type { CollectEventPayload, Hand } from './loadHandsFile';
import type { PlayersFile } from './loadPlayersFile';
import { pokerNowPlayerIdToPlayerId } from './pokerNowPlayerIdToPlayerId';
import { round } from './round';

export type ActionMatrix = {
	[loserPlayerId: string]: {
		[winnerPlayerId: string]: number;
	};
};

export const computeHandActionMatrix = (players: PlayersFile, hand: Hand): ActionMatrix => {
	const totalCommittedByPlayerId: Record<string, number> = {};
	let streetCommittedByPlayerId: Record<string, number> = {};
	const foldedPlayerIds: number[] = [];

	for (const event of hand.events) {
		const p = event.payload;

		if (
			p.type === 'PostBigBlind' ||
			p.type === 'PostSmallBlind' ||
			p.type === 'PostMissingBigBlind' ||
			p.type === 'PostMissingSmallBlind' ||
			p.type === 'Call' ||
			p.type === 'Raise'
		) {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			const playerId = pokerNowPlayerIdToPlayerId(players, player.id);
			streetCommittedByPlayerId[playerId] = p.value;
		} else if (p.type === 'Uncall') {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			const playerId = pokerNowPlayerIdToPlayerId(players, player.id);
			streetCommittedByPlayerId[playerId]! -= p.value;
		} else if (p.type === 'Fold') {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			const playerId = pokerNowPlayerIdToPlayerId(players, player.id);
			foldedPlayerIds.push(playerId);
		} else if (p.type === 'DealBoardCard' || p.type === 'HandFinished') {
			Object.entries(streetCommittedByPlayerId).forEach(([playerId, value]) => {
				if (playerId in totalCommittedByPlayerId) {
					totalCommittedByPlayerId[playerId]! += value;
				} else {
					totalCommittedByPlayerId[playerId] = value;
				}
			});
			streetCommittedByPlayerId = {};
		}
	}

	const potContributionCaps = new Set<number>(
		Object.entries(totalCommittedByPlayerId)
			.filter(([playerId]) => !foldedPlayerIds.includes(parseInt(playerId)))
			.map(([_, committed]) => committed)
	);
	const sortedPotContributionCaps = [...potContributionCaps.values()].sort();

	const actionMatrix: ActionMatrix = {};
	for (let i = 0; i < sortedPotContributionCaps.length; i++) {
		const potContributionCap = sortedPotContributionCaps[i]!;

		const collects = hand.events
			.filter((e) => e.payload.type === 'Collect' && e.payload.position === i + 1)
			.map((e) => e.payload as CollectEventPayload);
		const winningPlayerIds = collects.map((c) => {
			const player = hand.players.find((p) => p.seat === c.seat)!;
			const playerId = pokerNowPlayerIdToPlayerId(players, player.id);
			return playerId;
		});

		const previousPotContributionCap = sortedPotContributionCaps[i - 1] ?? 0;
		const potContributionsByPlayer = Object.fromEntries(
			Object.entries(totalCommittedByPlayerId).map(([playerId, contribution]) => [
				playerId,
				Math.max(0, Math.min(contribution, potContributionCap) - previousPotContributionCap)
			])
		);

		Object.entries(potContributionsByPlayer).forEach(([contributedPlayerId, potContribution]) => {
			const paidToWinners = potContribution / winningPlayerIds.length;
			if (paidToWinners === 0) return;
			winningPlayerIds.forEach((winningPlayerId) => {
				if (winningPlayerId.toString() === contributedPlayerId) return;
				if (!(contributedPlayerId in actionMatrix)) actionMatrix[contributedPlayerId] = {};
				actionMatrix[contributedPlayerId]![winningPlayerId] = round(
					convertStack(paidToWinners, hand.cents),
					2
				);
			});
		});
	}

	return actionMatrix;
};
