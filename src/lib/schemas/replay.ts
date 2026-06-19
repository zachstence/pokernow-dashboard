import { z } from 'zod';

const playerInHandSchema = z.object({
	id: z.string(),
	seat: z.number(),
	name: z.string(),
	stack: z.number(),
	hand: z.array(z.string()).optional()
});

const checkPayload = z.object({ type: z.literal(0), seat: z.number() });

const bigBlindPayload = z.object({ type: z.literal(2), seat: z.number(), value: z.number() });

const smallBlindPayload = z.object({ type: z.literal(3), seat: z.number(), value: z.number() });

const callPayload = z.object({
	type: z.literal(7),
	seat: z.number(),
	value: z.number(),
	allIn: z.boolean().optional()
});

const betRaisePayload = z.object({
	type: z.literal(8),
	seat: z.number(),
	value: z.number(),
	allIn: z.boolean().optional()
});

const communityCardsPayload = z.object({
	type: z.literal(9),
	turn: z.number(),
	run: z.number(),
	cards: z.array(z.string()),
	handsLabels: z.record(z.array(z.object({ c: z.number(), d: z.array(z.string()).optional() })))
});

const showdownWinnerPayload = z.object({
	type: z.literal(10),
	pot: z.number(),
	seat: z.number(),
	value: z.number(),
	cards: z.array(z.string()).optional(),
	combination: z.array(z.string()).optional(),
	handDescription: z.string().optional(),
	position: z.number().optional(),
	runNumber: z.string().optional(),
	hiLo: z.string().optional()
});

const foldPayload = z.object({ type: z.literal(11), seat: z.number() });

const showCardsPayload = z.object({
	type: z.literal(12),
	seat: z.number(),
	cards: z.array(z.string().nullable())
});

const handCompletePayload = z.object({ type: z.literal(15) });

const uncalledBetRefundPayload = z.object({
	type: z.literal(16),
	value: z.number(),
	seat: z.number()
});

const missedBigBlindPayload = z.object({ type: z.literal(4), seat: z.number(), value: z.number() });

const missedSmallBlindPayload = z.object({ type: z.literal(5), seat: z.number(), value: z.number() });

const handApprovalPayload = z.object({
	type: z.literal(14),
	approved: z.boolean(),
	autoApproved: z.boolean(),
	approvedSeats: z.array(z.number()),
	deniedSeats: z.array(z.number())
});

const eventPayloadSchema = z.discriminatedUnion('type', [
	checkPayload,
	bigBlindPayload,
	smallBlindPayload,
	missedBigBlindPayload,
	missedSmallBlindPayload,
	callPayload,
	betRaisePayload,
	communityCardsPayload,
	showdownWinnerPayload,
	foldPayload,
	showCardsPayload,
	handApprovalPayload,
	handCompletePayload,
	uncalledBetRefundPayload
]);

const handEventSchema = z.object({ at: z.number(), payload: eventPayloadSchema });

const handSchema = z.object({
	id: z.string(),
	handVersion: z.number(),
	number: z.string(),
	gameType: z.string(),
	cents: z.boolean(),
	smallBlind: z.number(),
	bigBlind: z.number(),
	ante: z.nullable(z.number()),
	straddleSeat: z.nullable(z.number()),
	dealerSeat: z.number(),
	startedAt: z.number(),
	bombPot: z.boolean(),
	sevenDeuceBounty: z.nullable(z.unknown()),
	doubleBoard: z.nullable(z.unknown()),
	players: z.array(playerInHandSchema),
	events: z.array(handEventSchema)
});

export const replayFileSchema = z.object({
	generatedAt: z.string(),
	playerId: z.string(),
	gameId: z.string(),
	hands: z.array(handSchema)
});
