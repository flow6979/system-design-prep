**In one line:** A process is an isolated memory box and a thread is a worker inside it (shared heap, own stack); use cores-many threads for CPU-bound work and async for I/O-bound.

- **Process vs thread:** process for isolation and crash safety; thread for fast sharing and low overhead.
- **Thread memory:** only the stack is separate; the heap is shared, hence race conditions.
- **States:** New, Ready, Running, Waiting, Terminated; Waiting goes to Ready first, never straight to Running.
- **Context switch:** ~1-5 us direct cost; the real pain is cold caches and TLB.
- **Threads vs cores:** for CPU-bound work threads ≈ cores; more only adds switching.
- **Java/Go:** platform thread is 1:1 with an OS thread (~1 MB stack); virtual threads and goroutines (~2 KB) are M:N, for I/O-bound work.
- **IPC:** pipes, shared memory (fastest, you handle sync), queues, sockets.
- **Scheduling:** Round Robin quantum far above switch cost (10-100 ms); SJF is impractical, real OSes use MLFQ/CFS.
- **fork/exec:** fork copies the process, exec loads a new program; a shell does both, then wait.
- **Zombie vs orphan:** zombie is a dead child never wait()ed; in containers use tini as PID 1.
- **1M connections:** event loop + epoll or virtual threads, not thread-per-connection.

**Say in the interview:** "For CPU-bound work I size threads to cores; for huge numbers of I/O connections I use an event loop or virtual threads."

**Avoid:** Saying threads have separate memory; running CPU-heavy work on the event loop.
