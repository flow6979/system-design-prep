**In one line:** A vending machine is a State machine where money must never vanish: escrow, change check, refund.

- **Requirements:** select slot, pay (coins/notes/UPI), dispense, return change; cancel allowed until dispensing starts.
- **Scale:** one machine, one session at a time; coins Rs 1/2/5/10, notes 20/50/100.
- **Components:** `VendingMachine` (context, Singleton), `Inventory`/`Slot`, `CashBox`, `PaymentStrategy`, `State` classes.
- **State over enum + switch:** 5 states x 4 actions = 20 branches; base class rejects by default, each state overrides only valid actions.
- **Strategy over if(mode):** a new payment mode (card, wallet) leaves the state machine untouched.
- **Escrow over direct cash box:** cancel returns the same coins, no change risk.
- **Order matters:** change check, then dispense, then settle; on a jam refund and mark the slot faulty.
- **Bottleneck:** no exact change or greedy fails (need 6, box {5,2,2,2}); fix with `canSettle` first + bounded coin-change DP.
- **Senior signal:** money as `int` rupees/`long` paise (never `double`), idempotent UPI webhook by `txnId`, `synchronized` entry points.

**Say in the interview:** "State pattern: Idle, ProductSelected, HasMoney, Dispensing, OutOfService. Payment is a Strategy, and the flow is always change check, dispense, settle so money never disappears."

**Avoid:** storing money in `double`; letting change fail after the product is dispensed.
