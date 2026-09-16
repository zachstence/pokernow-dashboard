import { argv0 } from 'process';
import type { CollectEventPayload, Hand } from './loadHandsFile';

export type ActionMatrix = {
	[loserPlayerId: string]: {
		[winnerPlayerId: string]: number;
	};
};

export const computeHandActionMatrix = (hand: Hand): ActionMatrix => {
	const totalCommittedByPlayerId: Record<string, number> = {};
	let streetCommittedByPlayerId: Record<string, number> = {};

	for (const event of hand.events) {
		const p = event.payload;

		const player = hand.players.find((player) => player.seat === p.seat);
		if (player) {
			console.log(player?.id, player?.name, p.type, p.value, p.allIn ? 'ALL IN' : '');
		} else {
			console.log(p.type, p.turn);
		}

		if (
			p.type === 'PostBigBlind' ||
			p.type === 'PostSmallBlind' ||
			p.type === 'PostMissingBigBlind' ||
			p.type === 'PostMissingSmallBlind' ||
			p.type === 'Call' ||
			p.type === 'Raise'
		) {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			streetCommittedByPlayerId[player.id] = p.value;
		} else if (p.type === 'Uncall') {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			streetCommittedByPlayerId[player.id]! -= p.value;
		} else if (p.type === 'DealBoardCard' || p.type === 'HandFinished') {
			Object.entries(streetCommittedByPlayerId).forEach(([playerId, value]) => {
				if (playerId in totalCommittedByPlayerId) {
					console.log(
						`  ${playerId} += ${value}  =>  ${totalCommittedByPlayerId[playerId]! + value}`
					);
					totalCommittedByPlayerId[playerId]! += value;
				} else {
					console.log(`  ${playerId} = ${value}`);
					totalCommittedByPlayerId[playerId] = value;
				}
			});
			console.log({ streetCommittedByPlayerId });
			streetCommittedByPlayerId = {};
		}
	}

	console.log({ totalCommittedByPlayerId });

	const uniqueCommitments = new Set<number>(Object.values(totalCommittedByPlayerId));
	const sortedUniqueCommitments = [...uniqueCommitments.values()].sort();
	console.log({ sortedUniqueCommitments });

	const actionMatrix: ActionMatrix = {};
	for (let i = 0; i < sortedUniqueCommitments.length; i++) {
		const commitment = sortedUniqueCommitments[i]!;
		const committedPlayerIds = Object.entries(totalCommittedByPlayerId)
			.filter(([_, value]) => value >= commitment)
			.map(([playerId]) => playerId);

		const collects = hand.events
			.filter((e) => e.payload.type === 'Collect' && e.payload.position === i + 1)
			.map((e) => e.payload as CollectEventPayload);
		const winningPlayerIds = collects.map((c) => {
			const player = hand.players.find((p) => p.seat === c.seat)!;
			return player.id;
		});

		const previousCommitment = sortedUniqueCommitments[i - 1] ?? 0;
		const potCommitment = commitment - previousCommitment;
		const paidToWinners = potCommitment / winningPlayerIds.length;

		committedPlayerIds.forEach((committedPlayerId) => {
			winningPlayerIds.forEach((winningPlayerId) => {
				if (winningPlayerId === committedPlayerId) return;
				if (!(committedPlayerId in actionMatrix)) actionMatrix[committedPlayerId] = {};
				actionMatrix[committedPlayerId]![winningPlayerId] = paidToWinners;
			});
		});
	}

	console.log(actionMatrix);

	return {};
};
