import { buildProfitLossData } from './buildProfitLossData';
import { loadHandsFile } from './loadHandsFile';
import { loadPlayersFile } from './loadPlayersFile';

const players = await loadPlayersFile();
// console.log({ players });

const handsFile = await loadHandsFile('./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json');
// console.log({ handsFile });

// console.log('===== HAND 0 =====');
// console.log(handsFile.hands[0]!.players);

// console.log('===== HAND 1 =====');
// console.log(handsFile.hands[1]!.players);

// const endingBalances = computeHandEndingBalances(players, handsFile.hands[0]!);
// console.log({ endingBalances });

const profitLossData = await buildProfitLossData(players, [handsFile]);

const numHands = Object.values(profitLossData)[0]!.length;

const header = `        ${Object.keys(profitLossData)
	.map((x) => x.padStart(7, ' '))
	.join(' | ')}`;
console.log(header);
console.log('-'.repeat(65));

for (let h = 0; h < numHands; h++) {
	let line = Object.values(profitLossData)
		.map((hands) => {
			const value = hands[h]!.value;
			const s = value.toFixed(2);
			const signed = value > 0 ? `+${s}` : value < 0 ? s : ` ${s}`;
			return signed.padStart(7, ' ');
		})
		.join(' | ');
	line = `${h}\t| ${line}`;
	console.log(line);
}
