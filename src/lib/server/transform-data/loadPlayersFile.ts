import { readFile } from 'node:fs/promises';
import z from 'zod';

const PlayersFileSchema = z.array(
	z.object({
		id: z.int(),
		displayName: z.string(),
		color: z.string(),
		pokerNowPlayerIds: z.array(z.string())
	})
);

export type PlayersFile = z.infer<typeof PlayersFileSchema>;

export type PlayerId = PlayersFile[number]['id'];

export const loadPlayersFile = async (): Promise<PlayersFile> => {
	const raw = await readFile('./data/players.json', { encoding: 'utf-8' });
	const json = JSON.parse(raw);
	const parsed = PlayersFileSchema.parse(json);
	return parsed;
};
