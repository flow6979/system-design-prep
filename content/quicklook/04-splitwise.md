**Ek line:** Splitwise me teen cheezein: split (Strategy), balance (paise-exact), simplify debts (greedy do heaps).

- **Requirements:** groups, `addExpense` (equal/exact/percent), pairwise + net balance, settle up, simplify debts, history.
- **Scale:** group size 10-20; greedy simplify max n-1 transfers; exact minimum NP-hard.
- **Components:** `ExpenseService`, `SplitStrategy` + `SplitStrategyFactory`, `BalanceSheet`, immutable `Expense`, `ExpenseListener`, `DebtSimplifier`.
- **Strategy over switch(type):** naya split (shares, adjustment) = nayi class, service same.
- **Paise over double:** amount `long` paise, percent basis points; leftover paise deterministic order me; sum exactly total.
- **Immutable ledger over overwrite:** edit/delete = reversal entry; audit aur recompute possible.
- **Group lock over none:** ek expense kai balances chhuta hai; DB me row lock sorted userId order ya optimistic version.
- **Bottleneck:** lost update + retry double-count; fix group lock, `requestId` idempotency, notifications lock ke bahar.
- **Senior signal:** final check shares sum = amount, settle `<= due` lock ke andar, user tabhi group chhode jab net 0.

**Interview me bolo:** "Paisa `long` paise me, split Strategy se, aur har strategy ka output exactly total. Group-level lock aur requestId se concurrent aur retry safe."

**Galti mat karna:** float/`double` percentage ya random leftover distribution; Observer ko lock ke andar fire karna.
