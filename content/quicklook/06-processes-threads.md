**Ek line:** Process isolated memory ka dabba hai, thread uske andar ka worker (heap share, stack alag); CPU-bound ke liye cores jitne threads, I/O-bound ke liye async.

- **Process vs thread:** isolation/crash safety chahiye to process; fast sharing aur low overhead chahiye to thread.
- **Thread memory:** sirf stack alag hai, heap shared hai, isliye race conditions.
- **States:** New, Ready, Running, Waiting, Terminated; Waiting se seedha Running nahi, pehle Ready.
- **Context switch:** ~1-5 us direct; asli dard cache/TLB cold hona.
- **Threads vs cores:** CPU-bound mein threads ≈ cores; zyada karoge to sirf switching badhegi.
- **Java/Go:** platform thread = 1:1 OS thread (~1 MB stack); virtual threads aur goroutines (~2 KB) M:N, I/O-bound ke liye.
- **IPC:** pipes, shared memory (fastest, sync tumhari zimmedari), queues, sockets.
- **Scheduling:** Round Robin quantum context switch se bahut bada (10-100 ms); SJF practical nahi, real OS MLFQ/CFS.
- **fork/exec:** fork copy banata hai, exec naya program load karta hai; shell dono + wait.
- **Zombie vs orphan:** zombie = parent ne wait() nahi kiya; container mein PID 1 ke liye tini use karo.
- **10 lakh connections:** event loop + epoll ya virtual threads, thread-per-connection nahi.

**Interview me bolo:** "CPU-bound ke liye threads cores ke barabar, aur bahut saare I/O connections ke liye event loop ya virtual threads."

**Galti mat karna:** "Threads ki memory alag hoti hai" mat bolo; event loop pe CPU-heavy kaam mat chalao.
