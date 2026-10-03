**In one line:** A configurable Snake & Ladder: immutable `Board` (Builder), pluggable `Dice` (Strategy), and a testable game loop.

- **Requirements:** board size, snakes/ladders, round-robin turns, win by exact landing, events to logger/UI.
- **Scale:** 2-4+ players, default 10x10; one game is single-threaded (turn-based), a board can be shared.
- **Components:** `Board` + `Jump(from, to)`, `Player`, `Dice`, `Game` (turn `Deque`, positions, winners), `GameListener`, `BoardFactory`.
- **Strategy over if(diceType):** Standard, Multi, Crooked, Fixed dice without touching `Game`.
- **Builder over big constructor:** validate in `build()`: range, one jump per cell, no chains, immutable result.
- **DI over `new Random()`:** inject `FixedDice` for deterministic tests.
- **Observer over println:** logging, UI, analytics without touching `Game`.
- **Bottleneck:** invalid config (jump chain/cycle, snake on last cell); fail fast in the Builder, and `playTurn()` after game over throws `IllegalStateException`.
- **Senior signal:** overshoot rule kept separate, a `TurnRule` strategy (extra turn on 6), generalize `Jump` into a `Cell` interface.

**Say in the interview:** "Board is immutable via Builder, Dice is a Strategy, events go through Observer. I inject `FixedDice` to write a deterministic test of the game loop."

**Avoid:** keeping Random inside `Game` (flaky tests); letting a move overshoot to something like 102.
