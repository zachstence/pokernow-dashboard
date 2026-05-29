import fs from 'node:fs';
import path from 'node:path';
import { replayFileSchema } from '$lib/schemas/replay.js';
import type { ReplayFile } from '$lib/data/types.js';

const dataDir = path.resolve('data');

export function loadAllReplays(): ReplayFile[] {
	const files = fs
		.readdirSync(dataDir)
		.filter((f) => f.startsWith('poker-now-hands-') && f.endsWith('.json'));
	return files.map((file) => loadReplayFile(file));
}

export function loadReplayFile(filename: string): ReplayFile {
	const fullPath = path.join(dataDir, filename);
	const raw = fs.readFileSync(fullPath, 'utf-8');
	const parsed = JSON.parse(raw);
	return replayFileSchema.parse(parsed);
}

export function loadReplayByGameId(gameId: string): ReplayFile | undefined {
	const files = fs
		.readdirSync(dataDir)
		.filter((f) => f.startsWith('poker-now-hands-') && f.endsWith('.json'));
	for (const file of files) {
		const fullPath = path.join(dataDir, file);
		const raw = fs.readFileSync(fullPath, 'utf-8');
		const parsed = JSON.parse(raw);
		if (parsed.gameId === gameId) {
			return replayFileSchema.parse(parsed);
		}
	}
	return undefined;
}
