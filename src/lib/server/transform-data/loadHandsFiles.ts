import { readdir } from 'node:fs/promises';
import { loadHandsFile, type HandsFile } from './loadHandsFile';

const handsFileRegex = /^poker-now-hands-game-.*.json$/;

export const loadHandsFiles = async (): Promise<HandsFile[]> => {
	const dataFileNames = await readdir('./data');
	const handsFilePaths = dataFileNames
		.filter((filename) => handsFileRegex.test(filename))
		.map((filename) => `./data/${filename}`);
	const handsFiles = await Promise.all(handsFilePaths.map((path) => loadHandsFile(path)));
	// readdir order is alphabetical by game ID, not chronological
	const sorted = handsFiles.sort(
		(a, b) => getFileStartTime(a).getTime() - getFileStartTime(b).getTime()
	);
	console.log(sorted);
	return sorted;
};

const getFileStartTime = (file: HandsFile): Date => file.hands[0]?.startedAt ?? file.generatedAt;
