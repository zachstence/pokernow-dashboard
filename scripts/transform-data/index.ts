import { loadHandsFile } from './load-hands-file';

const handsFile = await loadHandsFile('./data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json');
console.log({ handsFile });
