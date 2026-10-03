**Ek line:** ATM = State machine + Chain of Responsibility notes + Strategy operations, aur network fail pe paisa safe (reversal).

- **Requirements:** card + PIN (3 galat pe block), balance/withdraw/deposit/transfer, notes breakup, har txn ka log.
- **Scale:** ek ATM ek user; notes 2000/500/200/100; daily limit jaise 25,000; session timeout 30s.
- **Components:** `Atm` (context), `AtmState`, `Operation`, `BankService`, `CashDispenser` + `NoteHandler` chain, `TransactionLog`.
- **State over enum + switch:** Idle > CardInserted > Authenticated > Transaction; bina card withdraw reject.
- **CoR over hardcoded loop:** 2000 > 500 > 200 > 100; naya note = naya link.
- **Strategy for Operation:** mini statement/PIN change = nayi class, states same.
- **Bank-side limit over ATM-side:** daily limit atomic bank pe, warna do ATMs se bypass; interface/DI se fake bank test.
- **Bottleneck:** debit ke baad timeout; cash mat do, `REVERSAL_PENDING` log, same `txnId` se idempotent `reverse()`.
- **Senior signal:** `plan()` debit se pehle, greedy fail (600 from 500x1, 200x3) pe backtracking/DP, restart pe log scan.

**Interview me bolo:** "State machine, notes ke liye CoR, operations Strategy. Withdraw me pehle plan, phir debit, phir dispense, aur fail pe txnId se idempotent reversal."

**Galti mat karna:** timeout pe cash de dena ya limit/PIN counter sirf ATM me rakhna.
