# TODO

- Fix number/string player ID weirdness with chart data / legend
- Generate all stats once to JSON files, then read in load functions/og endpoints (instead of recomputing every time)

## Stats ideas

- Overview page
  - Cards
    - Total Sessions Played
    - Total Hands Played
    - Total Players
    - Biggest Pot (and winner of it)
  - Player Standings table
    - Name (with color chip matching graph below)
    - Number of sessions played
    - Number of hands played
    - P&L (default sort descending by this column)
  - P&L graph
    - Each player as a line, color matching table above
    - Lower opacity / dashed line when sitting out
    - Legend, clicking enables/disables player's line
    - Zoomable?
  - Other ideas:
    - Rivalry matrix: A heatmap showing who wins the most money from whom. If Player A constantly stacks Player B, this matrix will highlight that beautifully.
- Session page
  - Same as Overview page, but just for this session
  - Other ideas:
    - The "Suckout" of the Night: The hand where someone won with the lowest pre-flop or turn equity (e.g., hitting a 2-outer on the river).
- Player page
  - Filters
    - By session
  - Cards
    - Total Hands Played
    - Total Hands Won
    - % Hands Won
    - Total buy-in amount
    - VPIP
    - PFR (Pre-Flop Raise %): How often they raise pre-flop.
    - 3-Bet %: How often they re-raise a pre-flop raiser. Great for spotting the hyper-aggressive players.
    - AF (Aggression Factor): Calculated as (Bets + Raises) / Calls. An AF greater than 3 is highly aggressive; less than 1 is very passive.
    - WTSD % (Went to Showdown): Of the hands where they saw a flop, how often did they stay until the river cards were shown?
    - WSD % (Won at Showdown): When they actually showed their cards, how often did they win?
    - C-Bet % (Continuation Bet): How often the pre-flop raiser bets the flop.
  - P&L graph

