import { readFile } from 'node:fs/promises';
import { z } from 'zod';

const PlayerSchema = z.object({
	id: z.string(),
	seat: z.int(),
	name: z.string(),
	stack: z.int()
});

const RankSchema = z.enum(['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']);
const SuitSchema = z.enum(['h', 'd', 'c', 's']);

type RankSchema = z.infer<typeof RankSchema>;
type SuitSchema = z.infer<typeof SuitSchema>;

type Card = { rank: RankSchema; suit: SuitSchema };

const CardSchema = z.preprocess(
	(val) => (typeof val === 'string' ? val.split('') : val),
	z.tuple([RankSchema, SuitSchema]).transform(([rank, suit]): Card => ({ rank, suit }))
);

const HandsLabelsSchema = z.record(
	z.string().refine((val) => val.trim() !== '' && Number.isInteger(Number(val))),
	z.array(
		z.object({
			c: z.int()
		})
	)
);

const PayloadSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal(0).transform(() => 'Check'),
		seat: z.int()
	}),
	// z.object({
	// 	type: z.literal(1)
	// }),
	z.object({
		type: z.literal(2).transform(() => 'PostBigBlind'),
		seat: z.int(),
		value: z.int()
	}),
	z.object({
		type: z.literal(3).transform(() => 'PostSmallBlind'),
		seat: z.int(),
		value: z.int()
	}),
	// Posting blind after leaving and rejoining table
	z.object({
		type: z.literal(4).transform(() => 'PostMissingBigBlind'),
		seat: z.int(),
		value: z.int()
	}),
	// Posting blind after leaving and rejoining table
	z.object({
		type: z.literal(5).transform(() => 'PostMissingSmallBlind'),
		seat: z.int(),
		value: z.int()
	}),
	// z.object({
	// 	type: z.literal(6)
	// }),
	z.object({
		type: z.literal(7).transform(() => 'Call'),
		seat: z.int(),
		value: z.int()
	}),
	z.object({
		type: z.literal(8).transform(() => 'Raise'),
		seat: z.int(),
		value: z.int()
	}),
	z.object({
		type: z.literal(9).transform(() => 'DealBoardCard'),
		turn: z.union([
			z.literal(1).transform(() => 'Flop'),
			z.literal(2).transform(() => 'Turn'),
			z.literal(3).transform(() => 'River')
		]),
		run: z.int(),
		cards: z.array(CardSchema),
		handsLabels: z.unknown()
	}),
	z.object({
		type: z.literal(10).transform(() => 'Collect'),
		seat: z.int(),
		value: z.int(),
		pot: z.int(),
		position: z.int()
	}),
	z.object({
		type: z.literal(11).transform(() => 'Fold')
	}),
	z.object({
		type: z.literal(12).transform(() => 'ShowCards'),
		seat: z.int(),
		cards: z.tuple([CardSchema.nullable(), CardSchema.nullable()])
	}),
	// z.object({
	// 	type: z.literal(13)
	// }),
	z.object({
		type: z.literal(14).transform(() => 'RunItTwiceDecision'),
		approved: z.boolean(),
		autoApproved: z.boolean(),
		approvedSeats: z.array(z.int()),
		deniedSeats: z.array(z.int())
	}),
	z.object({
		type: z.literal(15).transform(() => 'HandFinished')
	}),
	// Collecting blind bet after you take down uncontested pot
	z.object({
		type: z.literal(16).transform(() => 'Uncall')
	})
]);

const EventSchema = z.object({
	at: z.int().transform((epochMillis) => new Date(epochMillis)),
	payload: PayloadSchema
});

const HandSchema = z.object({
	id: z.string(),
	handVersion: z.number(),
	number: z.string().transform((s) => parseInt(s)),
	gameType: z.literal('th'), // Texas Hold'em
	cents: z.boolean(), // amounts are always a whole number, divide by 100 if cents=true
	smallBlind: z.int(),
	bigBlind: z.int(),
	ante: z.unknown(),
	straddleSeat: z.unknown(),
	dealerSeat: z.int(),
	startedAt: z.int().transform((epochMillis) => new Date(epochMillis)),
	bombPot: z.boolean(),
	sevenDeuceBounty: z.unknown(),
	doubleBoard: z.unknown(),
	players: z.array(PlayerSchema),
	events: z.array(EventSchema)
});

const HandsFileSchema = z.object({
	generatedAt: z.iso.datetime().transform((iso) => new Date(iso)),
	gameId: z.string(),
	hands: z.array(HandSchema)
});

export type HandsFile = z.infer<typeof HandsFileSchema>;

export const loadHandsFile = async (path: string): Promise<HandsFile> => {
	const raw = await readFile(path, { encoding: 'utf-8' });
	const json = JSON.parse(raw);
	const parsed = HandsFileSchema.parse(json);
	return parsed;
};
