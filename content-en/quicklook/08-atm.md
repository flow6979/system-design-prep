**In one line:** ATM = State machine + Chain of Responsibility for notes + Strategy for operations, with reversal so money stays safe on network failure.

- **Requirements:** card + PIN (block after 3 wrong), balance/withdraw/deposit/transfer, note breakup, log every transaction.
- **Scale:** one ATM one user; notes 2000/500/200/100; daily limit e.g. 25,000; 30s session timeout.
- **Components:** `Atm` (context), `AtmState`, `Operation`, `BankService`, `CashDispenser` + `NoteHandler` chain, `TransactionLog`.
- **State over enum + switch:** Idle > CardInserted > Authenticated > Transaction; withdraw without a card is rejected.
- **CoR over hardcoded loop:** 2000 > 500 > 200 > 100; a new note is a new link.
- **Strategy for Operation:** mini statement/PIN change is a new class, states unchanged.
- **Bank-side limit over ATM-side:** daily limit checked atomically at the bank, else two ATMs bypass it; interface/DI allows a fake bank in tests.
- **Bottleneck:** timeout after debit; do not dispense, log `REVERSAL_PENDING`, retry idempotent `reverse()` with the same `txnId`.
- **Senior signal:** `plan()` before debit, backtracking/DP when greedy fails (600 from 500x1, 200x3), scan the log on restart.

**Say in the interview:** "State machine, CoR for notes, Strategy for operations. Withdraw is plan, then debit, then dispense, and any failure triggers an idempotent reversal by txnId."

**Avoid:** dispensing cash on a timeout, or keeping the limit/PIN counter only on the ATM.
