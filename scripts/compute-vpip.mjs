import { readFileSync } from 'fs';

const handsFile = JSON.parse(
  readFileSync('data/poker-now-hands-game-pglXMnDTq51E3NjE7DsBSAhVj.json', 'utf-8')
);

const playersFile = JSON.parse(
  readFileSync('data/players.json', 'utf-8')
);

const idToName = {};
for (const p of playersFile) {
  for (const pid of p.pokerNowPlayerIds) {
    idToName[pid] = p.displayName;
  }
}

const stats = {};

for (const hand of handsFile.hands) {
  const handPlayers = hand.players.map(p => p.id);

  for (const pid of handPlayers) {
    if (!stats[pid]) stats[pid] = { hands: new Set(), voluntary: new Set() };
    stats[pid].hands.add(hand.id);
  }

  // Find the first community card deal event (flop type=9) to determine preflop cutoff
  let firstDealIdx = hand.events.findIndex(evt => evt.payload.type === 9);
  if (firstDealIdx === -1) firstDealIdx = hand.events.length;

  const preflopEvents = hand.events.slice(0, firstDealIdx);

  // For each player, check if they voluntarily put money in preflop (call=7 or raise=8)
  const voluntarilyPutIn = new Set();
  for (const evt of preflopEvents) {
    const p = evt.payload;
    if ((p.type === 7 || p.type === 8) && p.seat != null) {
      const player = hand.players.find(pl => pl.seat === p.seat);
      if (player) {
        voluntarilyPutIn.add(player.id);
      }
    }
  }

  for (const pid of voluntarilyPutIn) {
    stats[pid].voluntary.add(hand.id);
  }
}

for (const pid of Object.keys(stats).sort()) {
  const s = stats[pid];
  const total = s.hands.size;
  const vol = s.voluntary.size;
  const vpip = total > 0 ? ((vol / total) * 100).toFixed(1) : 'N/A';
  const name = idToName[pid] || pid;
  console.log(`${name.padEnd(8)} VPIP: ${vpip}% (${vol}/${total} hands)`);
}
