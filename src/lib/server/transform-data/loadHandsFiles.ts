import { readdir } from 'node:fs/promises';
import { loadHandsFile, type HandsFile } from './loadHandsFile';

const handsFileRegex = /^poker-now-hands-game-.*.json$/;

export const loadHandsFiles = async (): Promise<HandsFile[]> => {
	const dataFileNames = await readdir('./data');
	const handsFilePaths = dataFileNames
		.filter((filename) => handsFileRegex.test(filename))
		.map((filename) => `./data/${filename}`);
	return Promise.all(handsFilePaths.map((path) => loadHandsFile(path)));
};
