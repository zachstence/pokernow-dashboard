import type { CollectEventPayload, Hand } from './loadHandsFile';

export type ActionMatrix = {
	[loserPlayerId: string]: {
		[winnerPlayerId: string]: number;
	};
};

export const computeHandActionMatrix = (hand: Hand): ActionMatrix => {
	const totalCommittedByPlayerId: Record<string, number> = {};
	let streetCommittedByPlayerId: Record<string, number> = {};
	const foldedPlayerIds: string[] = [];

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
		} else if (p.type === 'Fold') {
			const player = hand.players.find((player) => player.seat === p.seat)!;
			foldedPlayerIds.push(player.id);
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

	const potContributionCaps = new Set<number>(
		Object.entries(totalCommittedByPlayerId)
			.filter(([playerId]) => !foldedPlayerIds.includes(playerId))
			.map(([_, committed]) => committed)
	);
	const sortedPotContributionCaps = [...potContributionCaps.values()].sort();
	console.log({ sortedUniqueCommitments: sortedPotContributionCaps });

	const actionMatrix: ActionMatrix = {};
	for (let i = 0; i < sortedPotContributionCaps.length; i++) {
		const potContributionCap = sortedPotContributionCaps[i]!;

		const collects = hand.events
			.filter((e) => e.payload.type === 'Collect' && e.payload.position === i + 1)
			.map((e) => e.payload as CollectEventPayload);
		const winningPlayerIds = collects.map((c) => {
			const player = hand.players.find((p) => p.seat === c.seat)!;
			return player.id;
		});

		const previousPotContributionCap = sortedPotContributionCaps[i - 1] ?? 0;
		const potContributionsByPlayer = Object.fromEntries(
			Object.entries(totalCommittedByPlayerId).map(([playerId, contribution]) => [
				playerId,
				Math.max(0, Math.min(contribution, potContributionCap) - previousPotContributionCap)
			])
		);

		console.log(`\n\n===== POT ${i + 1} ===== \n`);
		console.log({
			potContributionCap,
			potContributionsByPlayer,
			winningPlayerIds
		});

		Object.entries(potContributionsByPlayer).forEach(([contributedPlayerId, potContribution]) => {
			const paidToWinners = potContribution / winningPlayerIds.length;
			if (paidToWinners === 0) return;
			winningPlayerIds.forEach((winningPlayerId) => {
				if (winningPlayerId === contributedPlayerId) return;
				if (!(contributedPlayerId in actionMatrix)) actionMatrix[contributedPlayerId] = {};
				actionMatrix[contributedPlayerId]![winningPlayerId] = paidToWinners;
			});
		});
	}

	return actionMatrix;
};
