import { loadHandsFile } from './loadHandsFile';
import { loadPlayersFile } from './loadPlayersFile';

const players = await loadPlayersFile();
console.log({ players });

const handsFile = await loadHandsFile('./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json');
console.log({ handsFile });
