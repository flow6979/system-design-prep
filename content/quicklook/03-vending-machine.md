**Ek line:** Vending machine ek State machine hai jisme paisa kabhi gayab nahi hona chahiye: escrow, change check, refund.

- **Requirements:** select slot, pay (coins/notes/UPI), dispense, change; cancel dispense start hone tak.
- **Scale:** ek machine, ek session at a time; coins Rs 1/2/5/10, notes 20/50/100.
- **Components:** `VendingMachine` (context, Singleton), `Inventory`/`Slot`, `CashBox`, `PaymentStrategy`, `State` classes.
- **State over enum + switch:** 5 states x 4 actions = 20 branches; base class default reject, har state sirf valid actions.
- **Strategy over if(mode):** Cash/UPI/card naya mode aaye to state machine same.
- **Escrow over direct cashbox:** cancel pe wahi coins wapas, change ka risk nahi.
- **Order matters:** change check, phir dispense, phir settle; jam pe refund + slot faulty.
- **Bottleneck:** exact change nahi ya greedy fail (6 chahiye, box {5,2,2,2}); fix `canSettle` pehle + bounded coin-change DP.
- **Senior signal:** money `int` rupees/`long` paise (`double` nahi), idempotent UPI webhook by `txnId`, `synchronized` entry points.

**Interview me bolo:** "State pattern: Idle, ProductSelected, HasMoney, Dispensing, OutOfService. Payment Strategy hai, aur flow hamesha change check, dispense, settle, taaki paisa kabhi gayab na ho."

**Galti mat karna:** `double` me paisa rakhna; dispense ke baad change fail hone dena.
