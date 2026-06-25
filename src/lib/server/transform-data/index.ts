import { buildProfitLossData } from './buildProfitLossData';
import { convertStack } from './convertStack';
import { loadHandsFile } from './loadHandsFile';
import { loadHandsFiles } from './loadHandsFiles';
import { loadPlayersFile } from './loadPlayersFile';
import { round } from './round';

const players = await loadPlayersFile();
// console.log({ players });

await loadHandsFiles();

// const handsFile = await loadHandsFile('./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json');
// console.log({ handsFile });

// console.log('===== HAND 0 =====');
// console.log(handsFile.hands[0]!.players);

// console.log('===== HAND 1 =====');
// console.log(handsFile.hands[1]!.players);

// const endingBalances = computeHandEndingBalances(players, handsFile.hands[0]!);
// console.log({ endingBalances });

// const profitLossData = await buildProfitLossData(players, [handsFile]);

// const numHands = Object.values(profitLossData)[0]!.length;

// Log P/L data for each player
// const header = `        ${Object.keys(profitLossData)
// 	.map((x) => x.padStart(7, ' '))
// 	.join(' | ')}`;
// console.log(header);
// console.log('-'.repeat(65));

// for (let h = 0; h < numHands; h++) {
// 	let line = Object.values(profitLossData)
// 		.map((hands) => {
// 			const value = hands[h]!.value;
// 			const s = value.toFixed(2);
// 			const signed = value > 0 ? `+${s}` : value < 0 ? s : ` ${s}`;
// 			return signed.padStart(7, ' ');
// 		})
// 		.join(' | ');
// 	line = `${h}\t| ${line}`;
// 	console.log(line);
// }

// // Log actual vs expected hand starting stack
// const spotFixes: { [handIndex: number]: number } = {
// 	// 74: -0.1,
// 	// 82: -0.1,
// 	// 86: -0.1,
// 	// 139: -0.1
// };

// const player = players.find((p) => p.displayName === 'Zach')!;
// const playerId = player.id;
// const pokerNowPlayerId = player.pokerNowPlayerIds[0]!;

// const startingBalance = 25;
// const playerData = profitLossData[playerId]!;

// for (let h = 0; h < numHands - 1; h++) {
// 	for (const [handIndex, diff] of Object.entries(spotFixes)) {
// 		if (h > parseInt(handIndex)) {
// 			playerData[h]!.value += diff;
// 		}
// 	}

// 	const actualBalance = round(startingBalance + playerData[h]!.value, 2);

// 	const handPlayer = handsFile.hands[h]!.players.find((p) => p.id === pokerNowPlayerId);
// 	if (handPlayer) {
// 		const expectedBalance = convertStack(handPlayer!.stack, handsFile.hands[h]!.cents);
// 		const matches = actualBalance === expectedBalance;
// 		console.log(
// 			`${(h + 1).toString().padStart(3, ' ')} | ${actualBalance.toFixed(2).padStart(6, ' ')} | ${expectedBalance.toFixed(2).padStart(6, ' ')} | ${matches ? '✅' : '❌'}`
// 		);
// 		if (!matches) throw new Error();
// 	} else {
// 		console.log(
// 			`${(h + 1).toString().padStart(3, ' ')} | ${actualBalance.toFixed(2).padStart(6, ' ')} | not in hand`
// 		);
// 	}
// }
