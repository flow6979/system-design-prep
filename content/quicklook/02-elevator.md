**Ek line:** N elevators: hall + cabin requests, controller car assign kare, car LOOK order me stops serve kare, single-writer se race nahi.

- **Requirements:** hall request (floor + direction) dispatch; cabin request us car ka stop; door open/close; maintenance car ke stops doosri cars ko.
- **Scale:** 3-4 cars, floors 0-20; displays har move/door event pe update.
- **Components:** `ElevatorController` owns cars; `Elevator`, state classes, `Request` Commands, `DispatchStrategy`, `ElevatorListener`.
- **Two-level decision:** controller chooses car (dispatch), car chooses stop order (LOOK); dono alag rakho.
- **State over switch:** Idle/MovingUp/MovingDown/Maintenance; State car khud badalti hai, Strategy bahar se set hoti hai.
- **Command over direct call:** button press = object, queue me jaata hai, ek thread execute kare; log, retry, replay.
- **LOOK over SSTF:** SSTF me door ke floors starve; LOOK direction khatam karke palatta hai, SCAN last floor tak waste.
- **Bottleneck:** buttons alag threads se; fix `LinkedBlockingQueue` + ek controller thread `tick()` = single writer, lock nahi.
- **Senior signal:** aging (`cost - wait*k`) ya pending queue FIFO; zoning strategy peak hour ke liye.

**Interview me bolo:** "Dispatch aur stop-order alag levels hain. Buttons sirf Command queue me daalte hain, ek controller thread saari car state ka akela writer hai, aur LOOK se starvation bachta hai."

**Galti mat karna:** car ko beech me jhatke se rokna, ya door khule hote car move karna (move sirf `doorTicks == 0` pe).
