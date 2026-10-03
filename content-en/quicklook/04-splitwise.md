**In one line:** Splitwise is three things: split (Strategy), balance (paise-exact), and simplify debts (greedy with two heaps).

- **Requirements:** groups, `addExpense` (equal/exact/percent), pairwise + net balance, settle up, simplify debts, history.
- **Scale:** group size 10-20; greedy simplify gives at most n-1 transfers; exact minimum is NP-hard.
- **Components:** `ExpenseService`, `SplitStrategy` + `SplitStrategyFactory`, `BalanceSheet`, immutable `Expense`, `ExpenseListener`, `DebtSimplifier`.
- **Strategy over switch(type):** a new split (shares, adjustment) is a new class, service unchanged.
- **Paise over double:** amount as `long` paise, percent in basis points; leftover paise distributed in deterministic order; sum equals total exactly.
- **Immutable ledger over overwrite:** edit/delete = reversal entry; keeps audit and allows recompute.
- **Group lock over none:** one expense touches many balances; in a DB lock rows in sorted userId order or use an optimistic version.
- **Bottleneck:** lost updates and retries double-counting; fix with group lock, `requestId` idempotency, notifications outside the lock.
- **Senior signal:** final check that shares sum to amount, settle `<= due` inside the lock, a user leaves only at net 0.

**Say in the interview:** "Money is `long` paise, splits are Strategies and each output sums exactly to the total. A group-level lock and requestId make it safe under concurrency and retries."

**Avoid:** float percentages or random leftover distribution; firing Observers inside the lock.
