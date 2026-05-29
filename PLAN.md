# ZenPoker Dashboard — Implementation Plan

## Overview

A SvelteKit static site that reads PokerNow JSON replay files from `data/`, validates them with Zod, and renders a dashboard with per-session and per-player stats + charts using shadcn-svelte.

## Stack

- **Framework**: SvelteKit 5 (runes mode) + TypeScript
- **Adapter**: `@sveltejs/adapter-static`
- **Validation**: `zod`
- **UI**: `shadcn-svelte` (components via CLI: button, card, table, tabs, chart)
- **Charts**: shadcn-svelte `chart` component (backed by Layerchart)
- **Package manager**: `pnpm`
- **Testing**: `vitest`

## Event Type Reference (Reverse-Engineered from 2 data files)

| Type | Meaning | Money Impact |
|------|---------|-------------|
| 0 | Check | — |
| 2 | Big blind | committed = value (cumulative) |
| 3 | Small blind | committed = value (cumulative) |
| 7 | Call (no allIn) | committed = value (cumulative) |
| 7 | Call (allIn) | committed += value (all-in amount) |
| 8 | Bet/Raise (no allIn) | committed = value (cumulative) |
| 8 | Bet/Raise (allIn) | committed += value (all-in amount) |
| 9 | Community cards | — |
| 10 | Showdown winner | won += value |
| 11 | Fold | — |
| 12 | Show cards | — |
| 15 | Hand complete | — |
| 16 | Uncalled bet refund | refunded += value |

**Key rule**: For non-allIn events (types 2, 3, 7, 8 without `allIn: true`), the `value` is the player's **cumulative total committed** at that point in the hand. For allIn events, `value` is the **all-in amount** (additional chips pushed, equal to the player's remaining stack).

**Per-hand net result formula**: `net = won - committed + refunded`

## `data/players.json` Schema

```json
[
  {
    "displayName": "Zach",
    "color": "#3b82f6",
    "playerIds": ["P1DfeAJ3jD"]
  },
  {
    "displayName": "Zach 2",
    "color": "#ef4444",
    "playerIds": ["EijqWbw_pD"]
  }
]
```

Each entry maps one or more PokerNow internal IDs to a canonical player.

## Implementation Steps

### Step 1: Setup (Config + Dependencies)

**Changes:**
- `svelte.config.js` — swap `adapter-auto` for `adapter-static`
- `src/routes/+layout.ts` — add `export const prerender = true`
- Install packages

**Commands:**
```sh
pnpm add -D @sveltejs/adapter-static
pnpm add zod
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add button card table tabs chart
```

**Verify:** `pnpm build` produces static output, `pnpm lint` passes, commit.

### Step 2: Data Layer

**Files to create/modify:**

| File | Purpose |
|---|---|
| `src/lib/schemas/replay.ts` | Zod schemas for ReplayFile, Hand, PlayerInHand, HandEvent (discriminated union) |
| `src/lib/data/types.ts` | Inferred types + derived types (GameWithStats, PlayerResult, ChartPoint, etc.) |
| `src/lib/data/replay-loader.ts` | Reads and validates all `data/poker-now-hands-*.json` files |
| `src/lib/data/players.ts` | Reads `data/players.json`, provides identity lookup function |
| `src/lib/data/stats.ts` | Pure computation functions: computeGameStats, computeAggregateStats, buildPlayerTimeline |
| `src/lib/data/stats.test.ts` | Vitest unit tests for stats.ts |
| `data/players.json` | Player identity mapping |

**Stats computation logic per hand:**
1. For each player in the hand, initialize: `committed = 0`, `refunded = 0`, `won = 0`
2. Iterate events:
   - types 2, 3, 7, 8 (no allIn): `committed = value` (value is cumulative total)
   - types 7, 8 (allIn): `committed += value` (value is the all-in amount)
   - type 16: `refunded += value`
   - type 10: `won += value`
3. `net = won - committed + refunded`
4. Record starting stack (from `players[].stack`) and compute ending stack

**Verify:** `pnpm test` passes (unit tests), `pnpm build` succeeds, `pnpm lint` passes, commit.

### Step 3: Layout (App Shell + Nav)

**Files:**
- `src/routes/+layout.svelte` — sidebar nav with links to Dashboard, Games, and player profile links (generated from data)
- `src/routes/+layout.ts` — global `export const prerender = true`, shared load function that reads all game data and makes it available via `$page.data`

**Nav structure:**
```
┌─────────────────────────────┐
│  🃏 ZenPoker                │
│                             │
│  ● Dashboard                │
│  ● Games                    │
│  ─────                      │
│  Players                    │
│    ● Zach                   │
│    ● Zach 2                 │
└─────────────────────────────┘
```

The layout load function reads all games and computes aggregate data (including player list) in one place, making it available to all pages.

**Verify:** `pnpm build` succeeds, `pnpm lint` passes, commit.

### Step 4: Homepage (Overall Dashboard)

**Files:** `src/routes/+page.svelte` + `src/routes/+page.server.ts`

**Content:**
- **Stat cards** (using shadcn Card): total sessions, total hands, unique players, games with biggest pot
- **Player standings table**: player name, games played, hands played, total P&L, biggest win, biggest loss
- **Line chart**: cumulative player profit over time
  - X-axis: game sessions (ordered by first hand timestamp)
  - Y-axis: cumulative P&L
  - One series per player
  - Each data point = player's cumulative profit after that session

**Chart data built from:** `stats.ts` aggregate functions

**Verify:** `pnpm build` succeeds, `pnpm lint` passes, commit.

### Step 5: Games Routes

**Files:**
- `src/routes/games/+page.svelte` — game listing table
- `src/routes/games/[slug]/+page.server.ts` — load function (reads single game + computes stats)
- `src/routes/games/[slug]/+page.svelte` — game detail view

**`/games` listing:**
- Table with columns: Date, Game ID, Hands, Players, Biggest Pot
- Each row links to `/games/[gameId]`

**`/games/[slug]` detail:**
- Game header: date, starting stacks, blinds
- Per-player P&L summary cards
- **Line chart**: chip stack progression across hands
  - X-axis: hand number
  - Y-axis: chip stack
  - One series per player
  - Data points from each hand's starting stack

**Dynamic routing:** Use `prerender.entries` in `svelte.config.js` or `entries()` in `+page.server.ts` to enumerate all game IDs from the data directory.

**Verify:** `pnpm build` succeeds with all game detail pages prerendered, `pnpm lint` passes, commit.

### Step 6: Player Routes

**Files:**
- `src/routes/players/[slug]/+page.server.ts` — load function
- `src/routes/players/[slug]/+page.svelte` — player profile

**Content:**
- **Stat cards**: total sessions, total hands, total P&L, biggest win, biggest loss, win rate (hands won / hands played)
- **Line chart**: cumulative P&L over time (one point per session)
- **Per-session breakdown table**: session date, hands played, P&L for that session

**Dynamic routing:** `entries()` enumerates all player slugs from the identity mapping.

**Verify:** `pnpm build` succeeds with all player pages prerendered, `pnpm lint` passes, commit.

---

## Data Flow Summary

```
Build time (vite build)
  │
  ├── data/*.json → replay-loader.ts (reads + Zod validates)
  ├── data/players.json → players.ts (identity mapping)
  │
  ├── stats.ts (pure functions)
  │   ├── computeGameStats(game)     → per-player P&L, chip progression
  │   └── computeAggregateStats(games) → cumulative P&L, standings
  │
  ├── +layout.ts loads all data → $page.data
  ├── /games/[slug]/+page.server.ts loads single game → stats
  └── /players/[slug]/+page.server.ts loads player data → stats
  │
  ▼
Static HTML pages in build/
```

## Testing Strategy

- **Unit tests** (`vitest`): `stats.test.ts`
  - Test `computeGameStats` with known hand data → verify net results
  - Test `computeAggregateStats` across multiple games
  - Test edge cases: folded hands, all-in scenarios, refunds

## Deployment

`adapter-static` outputs to `build/`. Host anywhere (GitHub Pages, Netlify, etc.).
