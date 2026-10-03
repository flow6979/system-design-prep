**Ek line:** Configurable Snake & Ladder: immutable `Board` (Builder), pluggable `Dice` (Strategy), testable game loop.

- **Requirements:** board size, snakes/ladders, round-robin turns, exact landing pe jeet, events log/UI ko.
- **Scale:** 2-4+ players, default 10x10; ek game single-threaded (turn-based), board share ho sakta hai.
- **Components:** `Board` + `Jump(from, to)`, `Player`, `Dice`, `Game` (turn `Deque`, positions, winners), `GameListener`, `BoardFactory`.
- **Strategy over if(diceType):** Standard, Multi, Crooked, Fixed dice bina `Game` badle.
- **Builder over big constructor:** `build()` pe validate: range, ek cell pe ek jump, koi chain nahi, immutable result.
- **DI over `new Random()`:** `FixedDice` inject karke deterministic test.
- **Observer over println:** logging, UI, analytics `Game` chhue bina.
- **Bottleneck:** invalid config (jump chain/cycle, snake last cell pe); fix Builder me fail-fast, game over ke baad `playTurn()` = `IllegalStateException`.
- **Senior signal:** overshoot rule alag, `TurnRule` strategy (6 pe extra turn), `Jump` ko `Cell` interface me generalize.

**Interview me bolo:** "Board immutable Builder se, Dice Strategy, events Observer. `FixedDice` inject karke game loop ka deterministic test likhta hoon."

**Galti mat karna:** Random `Game` ke andar rakhna (flaky test); overshoot pe 102 jaisa position allow karna.
