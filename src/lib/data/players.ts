import fs from 'node:fs';
import path from 'node:path';
import type { PlayerIdentity } from '$lib/data/types.js';

const playersPath = path.resolve('data/players.json');

let _identities: PlayerIdentity[] | null = null;

function loadIdentities(): PlayerIdentity[] {
	if (_identities) return _identities;
	const raw = fs.readFileSync(playersPath, 'utf-8');
	_identities = JSON.parse(raw) as PlayerIdentity[];
	return _identities;
}

export function getPlayerIdentities(): PlayerIdentity[] {
	return loadIdentities();
}

export function lookupPlayer(pokerNowId: string): PlayerIdentity {
	const identities = loadIdentities();
	const match = identities.find((p) => p.playerIds.includes(pokerNowId));
	if (match) return match;
	return { displayName: pokerNowId, color: '#888888', playerIds: [pokerNowId] };
}
