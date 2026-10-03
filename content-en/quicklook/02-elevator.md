**In one line:** N elevators: hall + cabin requests, a controller assigns a car, each car serves stops in LOOK order, and a single writer avoids races.

- **Requirements:** hall request (floor + direction) is dispatched; cabin request becomes that car's stop; door open/close; a maintenance car's stops go to other cars.
- **Scale:** 3-4 cars, floors 0-20; displays update on every move/door event.
- **Components:** `ElevatorController` owns the cars; `Elevator`, state classes, `Request` Commands, `DispatchStrategy`, `ElevatorListener`.
- **Two-level decision:** controller picks the car (dispatch), the car picks stop order (LOOK); keep them separate.
- **State over switch:** Idle/MovingUp/MovingDown/Maintenance; State changes itself, Strategy is set from outside.
- **Command over direct call:** a button press is an object, queued and executed on one thread; loggable, retryable, replayable.
- **LOOK over SSTF:** SSTF starves far floors; LOOK finishes a direction then reverses; SCAN wastes travel to the last floor.
- **Bottleneck:** buttons press from many threads; fix with `LinkedBlockingQueue` + one controller thread running `tick()` as single writer, no locks.
- **Senior signal:** aging (`cost - wait*k`) or a FIFO pending queue; zoning strategy for peak hours.

**Say in the interview:** "Dispatch and stop order are separate levels. Buttons only enqueue Commands, one controller thread is the sole writer of car state, and LOOK prevents starvation."

**Avoid:** stopping a car abruptly mid-travel, or moving while the door is open (move only when `doorTicks == 0`).
