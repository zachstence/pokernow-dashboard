import type { ActionMatrix } from './computeHandActionMatrix';
import { round } from './round';

export const sumActionMatrices = (...actionMatrices: ActionMatrix[]): ActionMatrix =>
	actionMatrices.reduce<ActionMatrix>((sum, curr) => {
		Object.entries(curr).forEach(([loserPlayerId, winnersMap]) => {
			Object.entries(winnersMap).forEach(([winnerPlayerId, amount]) => {
				if (!(loserPlayerId in sum)) sum[loserPlayerId] = {};
				if (!(winnerPlayerId in sum[loserPlayerId]!)) sum[loserPlayerId]![winnerPlayerId] = 0;
				sum[loserPlayerId]![winnerPlayerId]! = round(
					sum[loserPlayerId]![winnerPlayerId]! + amount,
					2
				);
			});
		});
		return sum;
	}, {});
