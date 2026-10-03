**Ek line:** Virtual memory + paging har process ko isolated address space deta hai (page table + TLB); RAM kam padi to page replacement, aur zyada kam to thrashing.

- **Stack vs heap:** stack locals aur calls ke liye (fast, auto); heap runtime objects ke liye. Java objects heap pe, stack pe references.
- **Virtual memory:** MMU page table se translate karta hai; asli fayda isolation/protection, sirf "zyada RAM" nahi.
- **Paging:** fixed 4 KB pages/frames; address = page number + offset; x86-64 pe 4-level page table.
- **TLB:** translations ka cache, ~99% hit; miss = page table walk.
- **Page fault:** normal mechanism hai; major (disk) wale bure; segfault tab jab address hi invalid ho.
- **Paging vs segmentation:** fixed size, no external fragmentation vs variable size, logical.
- **Replacement:** FIFO, LRU, Optimal; exact LRU mehnga, isliye accessed bit + Clock. Belady anomaly FIFO mein.
- **Thrashing:** working set RAM mein nahi aata; CPU 10% par bhi slow ho to `vmstat` mein si/so dekho.
- **Copy-on-write:** page tab copy hota hai jab koi write kare; Redis BGSAVE mein memory ~2x tak ja sakti hai.
- **Locality:** array LinkedList se tez (cache locality); false sharing mein padding/@Contended.
- **OOM killer:** SIGKILL; JVM -Xmx ko container limit ke barabar mat rakho.

**Interview me bolo:** "Same Big-O hone par bhi array tez hai kyunki cache locality hoti hai; LinkedList ke nodes bikhre hote hain."

**Galti mat karna:** Page fault ko error mat samjho; Belady's anomaly LRU ko mat do (FIFO ki hai).
