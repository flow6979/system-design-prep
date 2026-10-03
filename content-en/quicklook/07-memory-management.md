**In one line:** Virtual memory plus paging gives each process an isolated address space (page table + TLB); when RAM runs short pages get replaced, and badly short means thrashing.

- **Stack vs heap:** stack for locals and calls (fast, automatic); heap for runtime objects. Java objects live on the heap, the stack holds references.
- **Virtual memory:** the MMU translates via the page table; the main win is isolation and protection, not just "more RAM".
- **Paging:** fixed 4 KB pages/frames; address = page number + offset; 4-level page table on x86-64.
- **TLB:** cache of translations, ~99% hit; a miss means a page table walk.
- **Page fault:** a normal mechanism; major (disk) faults are the bad ones; segfault only when the address is invalid.
- **Paging vs segmentation:** fixed size, no external fragmentation vs variable size, logical.
- **Replacement:** FIFO, LRU, Optimal; exact LRU is too costly, so accessed bit + Clock. Belady's anomaly is FIFO.
- **Thrashing:** working sets do not fit in RAM; slow at 10% CPU means check si/so in `vmstat`.
- **Copy-on-write:** a page is copied only on write; Redis BGSAVE memory can approach 2x.
- **Locality:** arrays beat LinkedList (cache locality); false sharing fixed by padding/@Contended.
- **OOM killer:** sends SIGKILL; do not set JVM -Xmx equal to the container limit.

**Say in the interview:** "Same Big-O, but an array is faster because of cache locality; LinkedList nodes are scattered, so each step is a cache miss."

**Avoid:** Treating a page fault as an error; blaming LRU for Belady's anomaly (it is FIFO).
